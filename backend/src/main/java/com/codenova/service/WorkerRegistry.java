package com.codenova.service;

import com.codenova.dto.WorkerView;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tracks the live state of every worker thread. A worker is identified by its
 * thread name (WORKER-01 ...), set by the pool's ThreadFactory, so the state
 * here reflects real threads doing real work — nothing is faked.
 */
@Service
public class WorkerRegistry {

    public static class Worker {
        volatile String state = "IDLE";
        volatile String currentOrder = null;
        volatile long processed = 0;
    }

    private final Map<String, Worker> workers = new ConcurrentHashMap<>();
    private final AtomicInteger peakActive = new AtomicInteger(0);

    /** Called when the pool is (re)sized. Rebuilds the roster. */
    public synchronized void reset(List<String> names) {
        workers.clear();
        for (String n : names) workers.put(n, new Worker());
        peakActive.set(0);
    }

    public void markActive(String name, String orderRef) {
        Worker w = workers.computeIfAbsent(name, k -> new Worker());
        w.state = "ACTIVE";
        w.currentOrder = orderRef;
        int active = activeCount();
        peakActive.accumulateAndGet(active, Math::max);
    }

    public void markIdle(String name) {
        Worker w = workers.get(name);
        if (w != null) {
            w.state = "IDLE";
            w.currentOrder = null;
            w.processed++;
        }
    }

    public int activeCount() {
        return (int) workers.values().stream().filter(w -> "ACTIVE".equals(w.state)).count();
    }

    public int totalCount() { return workers.size(); }

    public int peakActive() { return peakActive.get(); }

    public List<WorkerView> snapshot() {
        List<WorkerView> out = new ArrayList<>();
        workers.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(e -> out.add(WorkerView.builder()
                .name(e.getKey()).state(e.getValue().state)
                .currentOrder(e.getValue().currentOrder)
                .processed(e.getValue().processed).build()));
        return out;
    }
}
