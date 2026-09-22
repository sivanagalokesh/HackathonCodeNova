package com.codenova.service;

import com.codenova.dto.LoadTestRequest;
import com.codenova.dto.LoadTestResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;

/**
 * Orchestrates the Concurrent Test Panel / Flash Sale simulation.
 * It fires N real orders at the shared pool and measures the real outcome —
 * no numbers here are invented; every value is a delta of the live counters.
 */
@Service
@RequiredArgsConstructor
public class LoadTestService {

    private final OrderService orderService;
    private final OrderProcessingEngine engine;
    private final InventoryService inventoryService;
    private final MetricsService metrics;
    private final EventPublisher events;

    public LoadTestResult run(LoadTestRequest req) {
        engine.resize(req.getWorkers());
        if (req.getResetInventoryTo() != null)
            inventoryService.setQuantity(req.getProductId(), req.getResetInventoryTo());

        int initial = inventoryService.quantityOf(req.getProductId());

        events.sale(java.util.Map.of(
                "type", "SALE_STARTED",
                "productId", req.getProductId(),
                "units", initial,
                "orders", req.getOrders(),
                "workers", req.getWorkers()));
        events.notify("info",
                "Flash sale started: " + req.getOrders() + " orders on " + initial + " units, "
                        + req.getWorkers() + " workers", null);

        long s0 = metrics.success(), o0 = metrics.outOfStock(),
             r0 = metrics.retries(), d0 = metrics.deadLetter();
        long wall0 = System.currentTimeMillis();

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < req.getOrders(); i++) {
            futures.add(orderService.fireTestOrder(
                    req.getProductId(), req.getQuantityPerOrder(), OrderProcessingEngine.FaultPlan.none()));
        }
        for (Future<?> f : futures) {
            try { f.get(); } catch (Exception ignored) {}
        }
        long wall = System.currentTimeMillis() - wall0;

        int finalInv = inventoryService.quantityOf(req.getProductId());
        long success = metrics.success() - s0;
        long oos     = metrics.outOfStock() - o0;
        long retries = metrics.retries() - r0;
        long dlq     = metrics.deadLetter() - d0;

        LoadTestResult result = LoadTestResult.builder()
                .submitted(req.getOrders())
                .successful(success)
                .outOfStock(oos)
                .technicalFailures(dlq)
                .retries(retries)
                .deadLetter(dlq)
                .initialInventory(initial)
                .finalInventory(finalInv)
                .negativeInventory(finalInv < 0)
                .peakActiveWorkers(engine.peakActiveWorkers())
                .avgProcessingMs(metrics.avgProcessingMs())
                .wallClockMs(wall)
                .build();

        events.sale(java.util.Map.of("type", "SALE_ENDED", "finalInventory", finalInv));
        events.notify("info",
                "Flash sale complete: " + success + " sold, " + oos + " out of stock, final stock " + finalInv, null);
        engine.broadcastLive();
        return result;
    }
}
