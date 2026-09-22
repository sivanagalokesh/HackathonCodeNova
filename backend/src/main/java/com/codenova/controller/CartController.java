package com.codenova.controller;

import com.codenova.dto.CartItemRequest;
import com.codenova.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cart;

    @GetMapping("/{userId}")
    public Map<String, Object> view(@PathVariable Long userId) { return cart.view(userId); }

    @PostMapping("/add")
    public Map<String, Object> add(@Valid @RequestBody CartItemRequest r) {
        cart.add(r.getUserId(), r.getProductId(), r.getQuantity());
        return cart.view(r.getUserId());
    }

    @PostMapping("/update")
    public Map<String, Object> update(@Valid @RequestBody CartItemRequest r) {
        cart.setQuantity(r.getUserId(), r.getProductId(), r.getQuantity());
        return cart.view(r.getUserId());
    }

    @PostMapping("/remove")
    public Map<String, Object> remove(@RequestBody CartItemRequest r) {
        cart.remove(r.getUserId(), r.getProductId());
        return cart.view(r.getUserId());
    }

    @DeleteMapping("/{userId}")
    public void clear(@PathVariable Long userId) { cart.clear(userId); }
}
