package com.codenova.service;

import com.codenova.model.CartItem;
import com.codenova.model.Product;
import com.codenova.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartRepo;
    private final ProductRepository productRepo;
    private final InventoryService inventoryService;

    @Transactional
    public void add(Long userId, Long productId, int qty) {
        CartItem existing = cartRepo.findByUserIdAndProductId(userId, productId).orElse(null);
        if (existing == null) {
            cartRepo.save(CartItem.builder().userId(userId).productId(productId).quantity(qty).build());
        } else {
            existing.setQuantity(existing.getQuantity() + qty);
            cartRepo.save(existing);
        }
    }

    @Transactional
    public void setQuantity(Long userId, Long productId, int qty) {
        CartItem existing = cartRepo.findByUserIdAndProductId(userId, productId).orElse(null);
        if (existing == null) return;
        if (qty <= 0) cartRepo.delete(existing);
        else { existing.setQuantity(qty); cartRepo.save(existing); }
    }

    @Transactional
    public void remove(Long userId, Long productId) {
        cartRepo.findByUserIdAndProductId(userId, productId).ifPresent(cartRepo::delete);
    }

    @Transactional
    public void clear(Long userId) { cartRepo.deleteByUserId(userId); }

    public Map<String, Object> view(Long userId) {
        List<CartItem> items = cartRepo.findByUserId(userId);
        List<Map<String, Object>> lines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        for (CartItem ci : items) {
            Product p = productRepo.findById(ci.getProductId()).orElse(null);
            if (p == null) continue;
            BigDecimal line = p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            BigDecimal disc = line.multiply(BigDecimal.valueOf(p.getDiscountPct() == null ? 0 : p.getDiscountPct()))
                                  .divide(BigDecimal.valueOf(100));
            subtotal = subtotal.add(line);
            discountTotal = discountTotal.add(disc);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", p.getId());
            m.put("name", p.getName());
            m.put("imageUrl", p.getImageUrl());
            m.put("price", p.getPrice());
            m.put("discountPct", p.getDiscountPct());
            m.put("quantity", ci.getQuantity());
            m.put("stock", inventoryService.quantityOf(p.getId()));
            m.put("lineTotal", line.subtract(disc));
            lines.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", lines);
        out.put("subtotal", subtotal);
        out.put("discount", discountTotal);
        out.put("total", subtotal.subtract(discountTotal));
        return out;
    }
}
