package com.codenova.repository;

import com.codenova.model.Order;
import com.codenova.model.enums.ProcessingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findTop50ByOrderByCreatedAtDesc();
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByProcessing(ProcessingStatus processing);
}
