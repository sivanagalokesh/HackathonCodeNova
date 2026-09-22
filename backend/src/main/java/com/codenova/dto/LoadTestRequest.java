package com.codenova.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/** Drives the Concurrent Test Panel / Flash Sale simulation. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LoadTestRequest {
    @NotNull private Long productId;
    @Min(1) private int orders;          // number of concurrent orders to fire
    @Min(1) private int quantityPerOrder;
    @Min(1) private int workers;         // resize the pool for this run
    private Integer resetInventoryTo;    // optional: reset stock before the run
}
