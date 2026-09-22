package com.codenova.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalesView {
    private Long productId;
    private String productName;
    private long unitsSold;
    private BigDecimal revenue;
}