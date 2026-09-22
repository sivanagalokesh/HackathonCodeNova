package com.codenova.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "product_id")
    private Long productId;
    private String author;
    private Integer rating;
    private String comment;
    @Column(name = "created_at")
    private Instant createdAt;
}
