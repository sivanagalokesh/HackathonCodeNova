package com.codenova.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationMessage {
    private String level;   // info | success | warn | error
    private String text;
    private Long orderId;
    private String timestamp;
}
