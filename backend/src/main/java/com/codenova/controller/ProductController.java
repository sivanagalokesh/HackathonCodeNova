package com.codenova.controller;

import com.codenova.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService products;

    @GetMapping("/products")
    public List<Map<String, Object>> all(@RequestParam(required = false) String q) {
        return q == null ? products.all() : products.search(q);
    }

    @GetMapping("/products/{id}")
    public Map<String, Object> one(@PathVariable Long id) { return products.byId(id); }

    @GetMapping("/products/category/{categoryId}")
    public List<Map<String, Object>> byCategory(@PathVariable Long categoryId) {
        return products.byCategory(categoryId);
    }

    @GetMapping("/categories")
    public Object categories() { return products.categories(); }

    /** One call that powers the whole homepage. */
    @GetMapping("/home")
    public Map<String, Object> home() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("featured", products.featured());
        m.put("trending", products.trending());
        m.put("bestSellers", products.bestSellers());
        m.put("lowStock", products.lowStock());
        m.put("categories", products.categories());
        return m;
    }
}
