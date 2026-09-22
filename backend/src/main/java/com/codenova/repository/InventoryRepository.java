package com.codenova.repository;

import com.codenova.model.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    /**
     * The heart of the overselling guarantee. PESSIMISTIC_WRITE issues a
     * SELECT ... FOR UPDATE, so only one transaction holds the row at a time.
     * Every concurrent worker for the same product serialises here.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId = :productId")
    Optional<Inventory> findByProductIdForUpdate(@Param("productId") Long productId);

    // Non-locking read for display purposes.
    Optional<Inventory> findByProductId(Long productId);
}
