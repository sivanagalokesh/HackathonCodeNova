package com.codenova.service;

import com.codenova.dto.MetricsView;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/** Aggregates counters computed from real processing outcomes. */
@Service
public class MetricsService {

    private final AtomicLong created   = new AtomicLong();
    private final AtomicLong success   = new AtomicLong();
    private final AtomicLong outOfStock= new AtomicLong();  // business failures
    private final AtomicLong retries   = new AtomicLong();  // total retry attempts
    private final AtomicLong deadLetter= new AtomicLong();
    private final AtomicLong procSumMs = new AtomicLong();
    private final AtomicLong procCount = new AtomicLong();

    // completion timestamps for a 1-second sliding window (orders/sec)
    private final ConcurrentLinkedDeque<Long> completions = new ConcurrentLinkedDeque<>();

    public void onCreated()    { created.incrementAndGet(); }
    public void onSuccess()    { success.incrementAndGet(); mark(); }
    public void onOutOfStock() { outOfStock.incrementAndGet(); mark(); }
    public void onRetry()      { retries.incrementAndGet(); }
    public void onDeadLetter() { deadLetter.incrementAndGet(); mark(); }

    public void recordProcessingTime(long ms) {
        procSumMs.addAndGet(ms);
        procCount.incrementAndGet();
    }

    private void mark() { completions.add(System.currentTimeMillis()); }

    public double ordersPerSecond() {
        long cutoff = System.currentTimeMillis() - 1000;
        completions.removeIf(t -> t < cutoff);
        return completions.size();
    }

    public double avgProcessingMs() {
        long c = procCount.get();
        return c == 0 ? 0 : Math.round((double) procSumMs.get() / c * 10.0) / 10.0;
    }

    public MetricsView snapshot(WorkerRegistry wr, long queued, long inFlight, long heroInventory) {
        return MetricsView.builder()
            .totalOrders(created.get())
            .processing(inFlight)
            .queued(queued)
            .successful(success.get())
            .failed(outOfStock.get())
            .retrying(retries.get())
            .deadLetter(deadLetter.get())
            .activeWorkers(wr.activeCount())
            .totalWorkers(wr.totalCount())
            .currentInventoryHero(heroInventory)
            .ordersPerSecond(ordersPerSecond())
            .avgProcessingMs(avgProcessingMs())
            .peakActiveWorkers(wr.peakActive())
            .build();
    }

    public long created()    { return created.get(); }
    public long success()    { return success.get(); }
    public long outOfStock() { return outOfStock.get(); }
    public long retries()    { return retries.get(); }
    public long deadLetter() { return deadLetter.get(); }
}
