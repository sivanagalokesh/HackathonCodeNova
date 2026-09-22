package com.codenova.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoadTestResult {
    private int submitted;
    private long successful;
    private long outOfStock;
    private long technicalFailures;
    private long retries;
    private long deadLetter;
    private int initialInventory;
    private int finalInventory;
    private boolean negativeInventory;
    private int peakActiveWorkers;
    private double avgProcessingMs;
    private long wallClockMs;
}
