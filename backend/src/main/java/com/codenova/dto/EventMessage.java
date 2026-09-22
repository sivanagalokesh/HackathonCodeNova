package com.codenova.dto;

import lombok.*;

/** Streamed to /topic/events for the live console. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventMessage {
    private Long orderId;
    private String orderRef;
    private String type;
    private String message;
    private String worker;
    private String timestamp;
}
