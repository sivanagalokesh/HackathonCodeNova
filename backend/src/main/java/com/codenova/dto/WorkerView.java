package com.codenova.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkerView {
    private String name;       // WORKER-01
    private String state;      // IDLE | ACTIVE
    private String currentOrder;
    private long processed;
}
