package com.codenova.model;

import com.codenova.model.enums.EventType;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "order_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_id")
    private Long orderId;
    @Column(name = "order_ref")
    private String orderRef;
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type")
    private EventType eventType;
    private String message;
    private String worker;
    @Column(name = "created_at")
    private Instant createdAt;
}
