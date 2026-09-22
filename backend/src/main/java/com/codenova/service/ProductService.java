package com.codenova.service;

import com.codenova.model.*;
import com.codenova.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final InventoryRepository inventoryRepo;
    private final ReviewRepository reviewRepo;

    private Map<String, Object> withStock(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("brand", p.getBrand());
        m.put("description", p.getDescription());
        m.put("specs", p.getSpecs());
        m.put("price", p.getPrice());
        m.put("discountPct", p.getDiscountPct());
        m.put("rating", p.getRating());
        m.put("reviewCount", p.getReviewCount());
        m.put("imageUrl", p.getImageUrl());
        m.put("categoryId", p.getCategoryId());
        m.put("featured", p.getFeatured());
        m.put("trending", p.getTrending());
        m.put("bestSeller", p.getBestSeller());
        int stock = inventoryRepo.findByProductId(p.getId()).map(Inventory::getQuantity).orElse(0);
        m.put("stock", stock);
        return m;
    }

    public List<Map<String, Object>> all() {
        return productRepo.findAll().stream().map(this::withStock).collect(Collectors.toList());
    }

    public Map<String, Object> byId(Long id) {
        Product p = productRepo.findById(id).orElseThrow();
        Map<String, Object> m = withStock(p);
        m.put("reviews", reviewRepo.findByProductIdOrderByCreatedAtDesc(id));
        return m;
    }

    public List<Map<String, Object>> byCategory(Long categoryId) {
        return productRepo.findByCategoryId(categoryId).stream().map(this::withStock).collect(Collectors.toList());
    }

    public List<Map<String, Object>> featured()   { return productRepo.findByFeaturedTrue().stream().map(this::withStock).collect(Collectors.toList()); }
    public List<Map<String, Object>> trending()   { return productRepo.findByTrendingTrue().stream().map(this::withStock).collect(Collectors.toList()); }
    public List<Map<String, Object>> bestSellers(){ return productRepo.findByBestSellerTrue().stream().map(this::withStock).collect(Collectors.toList()); }

    public List<Map<String, Object>> lowStock() {
        return productRepo.findAll().stream()
            .map(this::withStock)
            .filter(m -> (int) m.get("stock") > 0 && (int) m.get("stock") <= 20)
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> search(String q) {
        if (q == null || q.isBlank()) return all();
        return productRepo.findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(q, q)
                .stream().map(this::withStock).collect(Collectors.toList());
    }

    public List<Category> categories() { return categoryRepo.findAll(); }
}
