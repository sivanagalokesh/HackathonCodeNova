package com.codenova.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Pushes a metrics + worker snapshot on a short cadence so orders/sec and idle
 *  transitions stay fresh even between order events. This is the ONLY polling in
 *  the system and it exists only to age out the 1s orders/sec window. */
@Component
@RequiredArgsConstructor
public class LiveBroadcaster {
    private final OrderProcessingEngine engine;

    @Scheduled(fixedRate = 800)
    public void tick() { engine.broadcastLive(); }
}
