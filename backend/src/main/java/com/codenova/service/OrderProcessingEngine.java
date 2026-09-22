package com.codenova.service;

import com.codenova.dto.OrderView;
import com.codenova.model.*;
import com.codenova.model.enums.*;
import com.codenova.repository.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * The concurrent order-processing engine.
 *
 *  - A real java.util.concurrent.ThreadPoolExecutor holds N worker threads named
 *    WORKER-01 .. WORKER-0N (via a custom ThreadFactory).
 *  - Orders are real tasks submitted to the pool; they are processed genuinely
 *    in parallel and queued when all workers are busy.
 *  - Stock deduction serialises on a MySQL row lock in InventoryService, so
 *    inventory can never go negative regardless of how many workers hit it at once.
 *  - Technical failures are retried with backoff up to max-retries, then routed
 *    to the dead-letter queue. Business failures (out of stock) are never retried.
 */
@Service
@RequiredArgsConstructor
public class OrderProcessingEngine {

    public static final long HERO_PRODUCT_ID = 1L; // Nova Book Pro — the flash-sale hero

    private final OrderRepository orderRepo;
    private final DeadLetterRepository dlqRepo;
    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepo;
    private final EventPublisher events;
    private final WorkerRegistry registry;
    private final MetricsService metrics;

    @Value("${codenova.engine.default-workers:5}") private int defaultWorkers;
    @Value("${codenova.engine.queue-capacity:1000}") private int queueCapacity;
    @Value("${codenova.engine.max-retries:3}") private int maxRetries;
    @Value("${codenova.engine.retry-backoff-ms:400}") private long retryBackoffMs;
    @Value("${codenova.engine.processing-delay-ms:350}") private long processingDelayMs;

    private volatile ThreadPoolExecutor executor;

    // ---- Fault injection (for the controlled retry / DLQ demos) ----
    public static class FaultPlan {
        public final boolean permanent;
        public final int transientFailures;
        private FaultPlan(boolean permanent, int transientFailures) {
            this.permanent = permanent; this.transientFailures = transientFailures;
        }
        public static FaultPlan none()               { return new FaultPlan(false, 0); }
        public static FaultPlan transientFails(int k) { return new FaultPlan(false, k); }
        public static FaultPlan permanent()          { return new FaultPlan(true, 0); }
    }

    @PostConstruct
    public void init() { resize(defaultWorkers); }

    @PreDestroy
    public void shutdown() { if (executor != null) executor.shutdownNow(); }

    /** (Re)create the pool with the requested number of named worker threads. */
    public synchronized void resize(int workers) {
        if (workers < 1) workers = 1;
        if (executor != null && executor.getCorePoolSize() == workers && !executor.isShutdown()) return;
        ThreadPoolExecutor old = executor;
        if (old != null) {
            old.shutdown();
            try { old.awaitTermination(2, TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
            if (!old.isTerminated()) old.shutdownNow();
        }
        AtomicInteger seq = new AtomicInteger(0);
        ThreadFactory factory = r -> {
            Thread t = new Thread(r);
            t.setName(String.format("WORKER-%02d", seq.incrementAndGet()));
            t.setDaemon(true);
            return t;
        };
        ThreadPoolExecutor ex = new ThreadPoolExecutor(
                workers, workers, 0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(queueCapacity), factory);
        ex.prestartAllCoreThreads();  // names appear immediately in the roster
        this.executor = ex;

        List<String> names = new ArrayList<>();
        for (int i = 1; i <= workers; i++) names.add(String.format("WORKER-%02d", i));
        registry.reset(names);
        broadcastLive();
    }

    /** Submit an order to the pool. Returns a Future so callers (load test) can await it. */
    public Future<?> submit(Long orderId, FaultPlan plan) {
        Order o = orderRepo.findById(orderId).orElseThrow();
        o.setProcessing(ProcessingStatus.QUEUED);
        orderRepo.save(o);
        events.event(orderId, o.getPublicRef(), EventType.ORDER_QUEUED,
                "Queued for processing (queue depth " + queueSize() + ")", null);
        events.orderUpdate(OrderView.of(o));
        broadcastLive();
        return executor.submit(() -> process(orderId, plan));
    }

    // ---- The worker task body ----
    private void process(Long orderId, FaultPlan plan) {
        String worker = Thread.currentThread().getName();
        Order order = orderRepo.findById(orderId).orElse(null);
        if (order == null) return;
        String ref = order.getPublicRef();

        registry.markActive(worker, ref);
        order.setWorker(worker);
        order.setProcessing(ProcessingStatus.PROCESSING);
        order.setStatus(OrderStatus.PROCESSING);
        orderRepo.save(order);
        events.event(orderId, ref, EventType.WORKER_ASSIGNED, "Assigned to " + worker, worker);
        events.orderUpdate(OrderView.of(order));
        broadcastLive();

        long start = System.currentTimeMillis();
        int attempt = 0;
        try {
            boolean done = false;
            while (!done) {
                attempt++;
                events.event(orderId, ref, EventType.PROCESSING_STARTED,
                        attempt == 1 ? "Processing started" : "Processing (attempt " + attempt + ")", worker);
                try {
                    sleepQuiet(processingDelayMs);            // simulated business work on the real worker
                    injectFault(plan, attempt);              // may throw a retryable technical failure
                    InventoryService.Result r = inventoryService.reserve(order, worker);

                    if (r == InventoryService.Result.SUCCESS) {
                        order.setProcessing(ProcessingStatus.SUCCESS);
                        order.setStatus(OrderStatus.PACKED);
                        order.setRetryCount(attempt - 1);
                        orderRepo.save(order);
                        if (attempt > 1)
                            events.event(orderId, ref, EventType.RETRY_SUCCESS,
                                    "Recovered on attempt " + attempt, worker);
                        events.event(orderId, ref, EventType.ORDER_SUCCESS, "Order completed successfully", worker);
                        metrics.onSuccess();
                        events.notify("success", "Order " + ref + " confirmed", orderId);
                    } else {
                        order.setProcessing(ProcessingStatus.FAILED);
                        order.setStatus(OrderStatus.FAILED);
                        order.setFailureReason("OUT_OF_STOCK");
                        orderRepo.save(order);
                        events.event(orderId, ref, EventType.ORDER_FAILED,
                                "Out of stock — business failure, not retried", worker);
                        metrics.onOutOfStock();
                        events.notify("warn", "Order " + ref + " failed: out of stock", orderId);
                    }
                    done = true;

                } catch (TechnicalProcessingException te) {
                    if (attempt <= maxRetries) {
                        order.setProcessing(ProcessingStatus.RETRYING);
                        order.setRetryCount(attempt);
                        order.setFailureReason(te.getMessage());
                        orderRepo.save(order);
                        events.event(orderId, ref, EventType.RETRY_FAILED,
                                "Attempt " + attempt + " failed: " + te.getMessage(), worker);
                        events.event(orderId, ref, EventType.RETRY_STARTED,
                                "Retry " + attempt + "/" + maxRetries, worker);
                        metrics.onRetry();
                        events.orderUpdate(OrderView.of(order));
                        events.notify("warn", "Order " + ref + " retrying (" + attempt + "/" + maxRetries + ")", orderId);
                        sleepQuiet(retryBackoffMs * attempt);   // linear backoff
                    } else {
                        order.setProcessing(ProcessingStatus.DEAD_LETTER);
                        order.setStatus(OrderStatus.FAILED);
                        order.setRetryCount(maxRetries);
                        order.setFailureReason(te.getMessage());
                        orderRepo.save(order);
                        dlqRepo.save(DeadLetter.builder()
                                .orderId(orderId).orderRef(ref).failureReason(te.getMessage())
                                .retryCount(maxRetries).worker(worker).createdAt(Instant.now()).build());
                        events.event(orderId, ref, EventType.ORDER_MOVED_TO_DLQ,
                                "Moved to dead-letter queue after " + maxRetries + " retries: " + te.getMessage(), worker);
                        metrics.onDeadLetter();
                        events.notify("error", "Order " + ref + " moved to dead-letter queue", orderId);
                        done = true;
                    }
                }
            }
        } finally {
            metrics.recordProcessingTime(System.currentTimeMillis() - start);
            registry.markIdle(worker);
            events.orderUpdate(OrderView.of(order));
            broadcastLive();
        }
    }

    private void injectFault(FaultPlan plan, int attempt) {
        if (plan == null) return;
        if (plan.permanent) throw new TechnicalProcessingException("DATABASE_TIMEOUT");
        if (plan.transientFailures > 0 && attempt <= plan.transientFailures)
            throw new TechnicalProcessingException("DATABASE_TIMEOUT");
    }

    private void sleepQuiet(long ms) {
        if (ms <= 0) return;
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    // ---- live state helpers ----
    public int queueSize()  { return executor == null ? 0 : executor.getQueue().size(); }
    public int inFlight()   { return registry.activeCount(); }
    public int workerCount(){ return registry.totalCount(); }

    public int peakActiveWorkers() { return registry.peakActive(); }

    public long heroInventory() {
        return inventoryRepo.findByProductId(HERO_PRODUCT_ID).map(Inventory::getQuantity).orElse(0);
    }

    /** Push a fresh metrics + worker snapshot to all dashboards. */
    public void broadcastLive() {
        events.metrics(metrics.snapshot(registry, queueSize(), inFlight(), heroInventory()));
        events.workers(registry.snapshot());
    }
}
