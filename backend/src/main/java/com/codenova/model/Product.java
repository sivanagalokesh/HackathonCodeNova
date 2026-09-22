package com.codenova.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String brand;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String specs;
    private BigDecimal price;
    @Column(name = "discount_pct")
    private Integer discountPct;
    private BigDecimal rating;
    @Column(name = "review_count")
    private Integer reviewCount;
    @Column(name = "image_url")
    private String imageUrl;
    @Column(name = "category_id")
    private Long categoryId;
    private Boolean featured;
    private Boolean trending;
    @Column(name = "best_seller")
    private Boolean bestSeller;
}
