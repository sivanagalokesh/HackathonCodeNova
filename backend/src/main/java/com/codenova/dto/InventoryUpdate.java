package com.codenova.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryUpdate {
    private Long productId;
    private int quantity;
    private boolean outOfStock;
}
