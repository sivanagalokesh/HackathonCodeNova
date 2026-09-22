package com.codenova.controller;

import com.codenova.dto.*;
import com.codenova.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orders;

    @PostMapping("/checkout")
    public OrderView checkout(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String name = (String) body.getOrDefault("customerName", "Customer");
        String address = (String) body.getOrDefault("address", "");
        return orders.checkoutCart(userId, name, address);
    }

    @PostMapping("/buy-now")
    public OrderView buyNow(@Valid @RequestBody BuyNowRequest req) { return orders.buyNow(req); }

    @GetMapping("/user/{userId}")
    public List<OrderView> myOrders(@PathVariable Long userId) { return orders.myOrders(userId); }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) { return orders.detail(id); }
}
