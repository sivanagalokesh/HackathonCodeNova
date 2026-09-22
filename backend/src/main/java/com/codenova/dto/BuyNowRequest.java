package com.codenova.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BuyNowRequest {
    @NotNull private Long userId;
    @NotNull private Long productId;
    @Min(1) private int quantity;
    private String customerName;
    private String address;
}
