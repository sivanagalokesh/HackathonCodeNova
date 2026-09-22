package com.codenova.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PlaceOrderRequest {
    @NotNull private Long userId;
    private String customerName;
    private String address;
    @NotEmpty private List<Line> items;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Line {
        @NotNull private Long productId;
        @Min(1) private int quantity;
    }
}
