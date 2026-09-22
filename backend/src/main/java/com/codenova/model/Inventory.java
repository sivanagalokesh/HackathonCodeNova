package com.codenova.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/** One hot row per product. Guarded by a pessimistic write lock during deduction. */
@Entity @Table(name = "inventory")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inventory {
    @Id
    @Column(name = "product_id")
    private Long productId;
    private Integer quantity;
    @Version
    private Long version;
    @Column(name = "updated_at")
    private Instant updatedAt;
}
