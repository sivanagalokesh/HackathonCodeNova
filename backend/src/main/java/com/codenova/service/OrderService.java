package com.codenova.service;

import com.codenova.dto.*;
import com.codenova.model.*;
import com.codenova.model.enums.*;
import com.codenova.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final OrderEventRepository eventRepo;
    private final ProductRepository productRepo;
    private final CartService cartService;
    private final CartItemRepository cartRepo;
    private final EventPublisher events;
    private final MetricsService metrics;
    private final OrderProcessingEngine engine;

    private static final AtomicLong SEQ = new AtomicLong(System.currentTimeMillis() % 1_000_000);

    private String nextRef() {
        return "ORD-" + SEQ.incrementAndGet() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    /** Persist an order + items as PENDING, then submit it to the processing engine. */
    @Transactional
    public Order persistOrder(Long userId, String name, String address, String source,
                              List<OrderItem> items, BigDecimal total) {
        Order order = orderRepo.save(Order.builder()
                .publicRef(nextRef()).userId(userId).customerName(name).address(address)
                .totalAmount(total).status(OrderStatus.ORDER_PLACED).processing(ProcessingStatus.PENDING)
                .retryCount(0).source(source).createdAt(Instant.now()).updatedAt(Instant.now())
                .build());
        for (OrderItem it : items) { it.setOrderId(order.getId()); itemRepo.save(it); }
        metrics.onCreated();
        events.event(order.getId(), order.getPublicRef(), EventType.ORDER_CREATED,
                "Order created (" + items.size() + " line(s), total " + total + ")", null);
        events.orderUpdate(OrderView.of(order));
        return order;
    }

    private OrderItem lineFor(Long productId, int qty) {
        Product p = productRepo.findById(productId).orElseThrow();
        int disc = p.getDiscountPct() == null ? 0 : p.getDiscountPct();
        BigDecimal unit = p.getPrice().subtract(
                p.getPrice().multiply(BigDecimal.valueOf(disc)).divide(BigDecimal.valueOf(100)));
        return OrderItem.builder().productId(productId).productName(p.getName())
                .quantity(qty).unitPrice(unit).build();
    }

    private BigDecimal totalOf(List<OrderItem> items) {
        return items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public OrderView checkoutCart(Long userId, String name, String address) {
        List<CartItem> cart = cartRepo.findByUserId(userId);
        if (cart.isEmpty()) throw new IllegalStateException("Cart is empty");
        List<OrderItem> items = cart.stream()
                .map(ci -> lineFor(ci.getProductId(), ci.getQuantity()))
                .collect(Collectors.toList());
        Order order = persistOrder(userId, name, address, "CUSTOMER", items, totalOf(items));
        cartService.clear(userId);
        engine.submit(order.getId(), OrderProcessingEngine.FaultPlan.none());
        return OrderView.of(order);
    }

    public OrderView buyNow(BuyNowRequest req) {
        List<OrderItem> items = List.of(lineFor(req.getProductId(), req.getQuantity()));
        Order order = persistOrder(req.getUserId(), req.getCustomerName(), req.getAddress(),
                "CUSTOMER", items, totalOf(items));
        engine.submit(order.getId(), OrderProcessingEngine.FaultPlan.none());
        return OrderView.of(order);
    }

    /** Fire a single order for the load test / flash sale / controlled fault demos. */
    public java.util.concurrent.Future<?> fireTestOrder(Long productId, int qty,
                                                        OrderProcessingEngine.FaultPlan plan) {
        List<OrderItem> items = List.of(lineFor(productId, qty));
        Order order = persistOrder(1L, "Load Test", "Simulated", "LOAD_TEST", items, totalOf(items));
        return engine.submit(order.getId(), plan);
    }

    public List<OrderView> recent() {
        return orderRepo.findTop50ByOrderByCreatedAtDesc().stream()
                .map(OrderView::of).collect(Collectors.toList());
    }

    public List<OrderView> myOrders(Long userId) {
        return orderRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderView::of).collect(Collectors.toList());
    }

    public Map<String, Object> detail(Long orderId) {
        Order o = orderRepo.findById(orderId).orElseThrow();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("order", OrderView.of(o));
        m.put("items", itemRepo.findByOrderId(orderId));
        m.put("timeline", eventRepo.findByOrderIdOrderByCreatedAtAsc(orderId));
        return m;
    }
}
