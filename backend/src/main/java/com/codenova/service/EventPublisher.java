package com.codenova.service;

import com.codenova.dto.*;
import com.codenova.model.OrderEvent;
import com.codenova.model.enums.EventType;
import com.codenova.repository.OrderEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Single choke-point for observability: every meaningful step is (1) persisted
 * to MySQL order_events and (2) streamed to the relevant WebSocket topic.
 * There are no UI-only events — the frontend only ever renders what passes here.
 */
@Service
@RequiredArgsConstructor
public class EventPublisher {

    private final OrderEventRepository eventRepo;
    private final SimpMessagingTemplate ws;

    /** Persist an order event and stream it to /topic/events. Own tx so events survive a rolled-back business tx. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void event(Long orderId, String ref, EventType type, String message, String worker) {
        Instant now = Instant.now();
        eventRepo.save(OrderEvent.builder()
                .orderId(orderId).orderRef(ref).eventType(type)
                .message(message).worker(worker).createdAt(now).build());

        ws.convertAndSend("/topic/events", EventMessage.builder()
                .orderId(orderId).orderRef(ref).type(type.name())
                .message(message).worker(worker).timestamp(now.toString()).build());
    }

    public void inventory(Long productId, int qty) {
        ws.convertAndSend("/topic/inventory", InventoryUpdate.builder()
                .productId(productId).quantity(qty).outOfStock(qty <= 0).build());
    }

    public void orderUpdate(OrderView view) {
        ws.convertAndSend("/topic/orders", view);
    }

    public void metrics(MetricsView m) {
        ws.convertAndSend("/topic/metrics", m);
    }

    public void workers(java.util.List<WorkerView> workers) {
        ws.convertAndSend("/topic/workers", workers);
    }

    public void sale(Object payload) {
        ws.convertAndSend("/topic/sales", payload);
    }

    public void notify(String level, String text, Long orderId) {
        ws.convertAndSend("/topic/notifications", NotificationMessage.builder()
                .level(level).text(text).orderId(orderId)
                .timestamp(Instant.now().toString()).build());
    }
}
