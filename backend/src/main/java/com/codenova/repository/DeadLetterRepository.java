package com.codenova.repository;

import com.codenova.model.DeadLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeadLetterRepository extends JpaRepository<DeadLetter, Long> {
    List<DeadLetter> findAllByOrderByCreatedAtDesc();
}
