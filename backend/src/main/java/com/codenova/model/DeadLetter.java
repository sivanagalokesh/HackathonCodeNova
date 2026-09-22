package com.codenova.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "dead_letter_queue")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeadLetter {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_id")
    private Long orderId;
    @Column(name = "order_ref")
    private String orderRef;
    @Column(name = "failure_reason")
    private String failureReason;
    @Column(name = "retry_count")
    private Integer retryCount;
    private String worker;
    @Column(name = "created_at")
    private Instant createdAt;
}
