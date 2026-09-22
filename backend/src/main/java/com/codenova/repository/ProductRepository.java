package com.codenova.repository;

import com.codenova.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByFeaturedTrue();
    List<Product> findByTrendingTrue();
    List<Product> findByBestSellerTrue();
    List<Product> findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(String name, String brand);
}
