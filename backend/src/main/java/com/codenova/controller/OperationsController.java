package com.codenova.controller;

import com.codenova.dto.*;
import com.codenova.model.enums.ProcessingStatus;
import com.codenova.repository.*;
import com.codenova.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationsController {

    private final OrderProcessingEngine engine;
    private final LoadTestService loadTest;
    private final OrderService orders;
    private final MetricsService metrics;
    private final WorkerRegistry registry;
    private final OrderEventRepository eventRepo;
    private final DeadLetterRepository dlqRepo;
    private final InventoryService inventoryService;
    private final OrderItemRepository orderItems;

    @GetMapping("/metrics")
    public MetricsView metrics() {
        return metrics.snapshot(registry, engine.queueSize(), engine.inFlight(), engine.heroInventory());
    }

    @GetMapping("/workers")
    public List<WorkerView> workers() { return registry.snapshot(); }

    @GetMapping("/events")
    public Object events() { return eventRepo.findTop100ByOrderByCreatedAtDesc(); }

    @GetMapping("/dlq")
    public Object dlq() { return dlqRepo.findAllByOrderByCreatedAtDesc(); }

    @GetMapping("/orders")
    public List<OrderView> recentOrders() { return orders.recent(); }

    @GetMapping("/sales")
    public List<SalesView> sales() {
        var totals = new java.util.LinkedHashMap<Long, SalesView>();
        for (var item : orderItems.findAll()) {
            if (item.getProductId() == null || item.getQuantity() == null) continue;
            var current = totals.computeIfAbsent(item.getProductId(), id -> SalesView.builder()
                .productId(id).productName(item.getProductName()).unitsSold(0).revenue(java.math.BigDecimal.ZERO).build());
            current.setUnitsSold(current.getUnitsSold() + item.getQuantity());
            current.setRevenue(current.getRevenue().add(item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))));
        }
        return totals.values().stream().sorted(java.util.Comparator.comparingLong(SalesView::getUnitsSold).reversed()).toList();
    }

    @GetMapping("/orders/{id}")
    public Map<String, Object> orderDetail(@PathVariable Long id) { return orders.detail(id); }

    /** The concurrent test panel / flash sale trigger. */
    @PostMapping("/load-test")
    public LoadTestResult loadTest(@Valid @RequestBody LoadTestRequest req) { return loadTest.run(req); }

    /** Controlled transient-failure demo: fails twice, then succeeds on retry. */
    @PostMapping("/test/retry")
    public String retryTest(@RequestParam(defaultValue = "1") Long productId) {
        orders.fireTestOrder(productId, 1, OrderProcessingEngine.FaultPlan.transientFails(2));
        return "Transient-failure order submitted (fails twice, recovers on attempt 3).";
    }

    /** Controlled permanent-failure demo: exhausts retries and lands in the DLQ. */
    @PostMapping("/test/permanent-failure")
    public String permanentTest(@RequestParam(defaultValue = "1") Long productId) {
        orders.fireTestOrder(productId, 1, OrderProcessingEngine.FaultPlan.permanent());
        return "Permanent-failure order submitted (3 retries, then dead-letter queue).";
    }

    @PostMapping("/inventory/reset")
    public String resetInventory(@RequestParam Long productId, @RequestParam int quantity) {
        inventoryService.setQuantity(productId, quantity);
        engine.broadcastLive();
        return "Inventory for product " + productId + " set to " + quantity;
    }

    @PostMapping("/workers/resize")
    public String resize(@RequestParam int workers) {
        engine.resize(workers);
        return "Worker pool resized to " + workers;
    }
}
