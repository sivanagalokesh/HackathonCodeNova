package com.codenova.dto;

import com.codenova.model.Order;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderView {
    private Long id;
    private String ref;
    private String customerName;
    private String status;
    private String processing;
    private String worker;
    private int retryCount;
    private String failureReason;
    private BigDecimal total;
    private String source;
    private String createdAt;

    public static OrderView of(Order o) {
        return OrderView.builder()
            .id(o.getId()).ref(o.getPublicRef()).customerName(o.getCustomerName())
            .status(o.getStatus() == null ? null : o.getStatus().name())
            .processing(o.getProcessing() == null ? null : o.getProcessing().name())
            .worker(o.getWorker()).retryCount(o.getRetryCount() == null ? 0 : o.getRetryCount())
            .failureReason(o.getFailureReason()).total(o.getTotalAmount()).source(o.getSource())
            .createdAt(o.getCreatedAt() == null ? null : o.getCreatedAt().toString())
            .build();
    }
}
