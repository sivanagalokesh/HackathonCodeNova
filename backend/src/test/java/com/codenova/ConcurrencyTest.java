package com.codenova;

import com.codenova.model.*;
import com.codenova.repository.*;
import com.codenova.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies the overselling guarantee end-to-end: fire far more orders than there
 * is stock, across many workers, and confirm the pessimistic-lock deduction never
 * lets inventory go negative and never sells more than exists.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ConcurrencyTest {

    @Autowired ProductRepository productRepo;
    @Autowired InventoryRepository inventoryRepo;
    @Autowired CategoryRepository categoryRepo;
    @Autowired OrderService orderService;
    @Autowired InventoryService inventoryService;
    @Autowired OrderProcessingEngine engine;
    @Autowired MetricsService metrics;

    Long productId;

    @BeforeEach
    void seed() {
        Category c = categoryRepo.save(Category.builder().name("Laptops").slug("laptops").icon("laptop").build());
        Product p = productRepo.save(Product.builder()
                .name("Nova Book Pro 14").brand("Nova").price(new BigDecimal("74999.00"))
                .discountPct(0).rating(new BigDecimal("4.6")).reviewCount(124)
                .categoryId(c.getId()).featured(true).trending(true).bestSeller(true).build());
        productId = p.getId();
        inventoryRepo.save(Inventory.builder().productId(productId).quantity(20).version(0L).build());
    }

    @Test
    void oversellingIsImpossible_under100ConcurrentOrders() throws Exception {
        engine.resize(10);
        long s0 = metrics.success(), o0 = metrics.outOfStock();

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            futures.add(orderService.fireTestOrder(productId, 1, OrderProcessingEngine.FaultPlan.none()));
        }
        for (Future<?> f : futures) f.get();

        int finalInventory = inventoryService.quantityOf(productId);
        long success = metrics.success() - s0;
        long outOfStock = metrics.outOfStock() - o0;

        assertTrue(finalInventory >= 0, "inventory must never go negative");
        assertEquals(0, finalInventory, "all 20 units should be sold");
        assertEquals(20, success, "exactly 20 orders may succeed");
        assertEquals(80, outOfStock, "the other 80 must be out-of-stock business failures");
    }

    @Test
    void variableQuantities_neverOversell() throws Exception {
        inventoryService.setQuantity(productId, 20);
        engine.resize(8);
        long s0Units = 20 - inventoryService.quantityOf(productId);

        List<Future<?>> futures = new ArrayList<>();
        int[] qtys = {5, 7, 6, 4, 3, 8, 2, 6, 5, 9};   // sums to 55, far over 20
        for (int q : qtys) futures.add(orderService.fireTestOrder(productId, q, OrderProcessingEngine.FaultPlan.none()));
        for (Future<?> f : futures) f.get();

        int finalInventory = inventoryService.quantityOf(productId);
        assertTrue(finalInventory >= 0, "inventory must never go negative");
        assertTrue(finalInventory <= 20, "cannot exceed initial stock");
    }

    @Test
    void permanentTechnicalFailure_lands_in_dlq() throws Exception {
        inventoryService.setQuantity(productId, 50);
        engine.resize(3);
        long d0 = metrics.deadLetter();
        orderService.fireTestOrder(productId, 1, OrderProcessingEngine.FaultPlan.permanent()).get();
        assertEquals(1, metrics.deadLetter() - d0, "a permanently failing order must reach the DLQ");
    }
}
