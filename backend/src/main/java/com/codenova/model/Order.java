package com.codenova.model;

import com.codenova.model.enums.OrderStatus;
import com.codenova.model.enums.ProcessingStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_ref")
    private String publicRef;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "customer_name")
    private String customerName;

    private String address;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    private ProcessingStatus processing;

    private String worker;

    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "failure_reason")
    private String failureReason;

    private String source;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
