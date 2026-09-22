package com.codenova.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    @Column(name = "created_at")
    private Instant createdAt;
}
