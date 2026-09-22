package com.codenova.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MetricsView {
    private long totalOrders;
    private long processing;
    private long queued;
    private long successful;
    private long failed;       // business failures (out of stock)
    private long retrying;
    private long deadLetter;
    private int activeWorkers;
    private int totalWorkers;
    private long currentInventoryHero;   // stock of the flash-sale hero product
    private double ordersPerSecond;
    private double avgProcessingMs;
    private int peakActiveWorkers;
}
