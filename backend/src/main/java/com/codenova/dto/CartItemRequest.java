package com.codenova.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CartItemRequest {
    @NotNull private Long userId;
    @NotNull private Long productId;
    @Min(1) private int quantity;
}
