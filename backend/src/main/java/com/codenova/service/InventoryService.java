package com.codenova.service;

import com.codenova.model.Inventory;
import com.codenova.model.Order;
import com.codenova.model.OrderItem;
import com.codenova.model.enums.EventType;
import com.codenova.repository.InventoryRepository;
import com.codenova.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepo;
    private final OrderItemRepository orderItemRepo;
    private final EventPublisher events;

    public enum Result { SUCCESS, OUT_OF_STOCK }

    /**
     * Atomically validates and deducts stock for every line of an order.
     *
     * Correctness: the whole method runs in one transaction and takes a
     * PESSIMISTIC_WRITE lock (SELECT ... FOR UPDATE) on each product's inventory
     * row, in ascending product-id order to avoid deadlocks. Concurrent workers
     * for the same product therefore serialise on the row lock, and the check +
     * decrement is a single critical section. Stock can never go negative and the
     * DB CHECK (quantity >= 0) is a second line of defence.
     *
     * All-or-nothing: if any line is short, nothing is deducted and the order is
     * a business failure (OUT_OF_STOCK) — not a technical failure, so it is not retried.
     */
    @Transactional
    public Result reserve(Order order, String worker) {
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        // deterministic lock ordering
        items.sort(Comparator.comparing(OrderItem::getProductId));

        events.event(order.getId(), order.getPublicRef(),
                EventType.INVENTORY_LOCK_REQUESTED, "Requesting write lock on inventory rows", worker);

        // Acquire all locks first.
        Map<Long, Inventory> locked = new LinkedHashMap<>();
        for (OrderItem it : items) {
            Inventory inv = inventoryRepo.findByProductIdForUpdate(it.getProductId())
                    .orElseThrow(() -> new TechnicalProcessingException("Inventory row missing for product " + it.getProductId()));
            locked.put(it.getProductId(), inv);
        }
        events.event(order.getId(), order.getPublicRef(),
                EventType.INVENTORY_LOCK_ACQUIRED, "Lock acquired on " + locked.size() + " row(s)", worker);

        // Validate every line.
        for (OrderItem it : items) {
            int available = locked.get(it.getProductId()).getQuantity();
            events.event(order.getId(), order.getPublicRef(), EventType.INVENTORY_CHECKED,
                    "Product " + it.getProductId() + " requested=" + it.getQuantity() + " available=" + available, worker);
            if (available < it.getQuantity()) {
                // business failure — release lock (tx returns) and report
                events.event(order.getId(), order.getPublicRef(), EventType.INVENTORY_LOCK_RELEASED,
                        "Lock released (insufficient stock)", worker);
                return Result.OUT_OF_STOCK;
            }
        }

        // Deduct every line.
        for (OrderItem it : items) {
            Inventory inv = locked.get(it.getProductId());
            int before = inv.getQuantity();
            int after = before - it.getQuantity();
            inv.setQuantity(after);
            inventoryRepo.save(inv);
            events.event(order.getId(), order.getPublicRef(), EventType.INVENTORY_DEDUCTED,
                    "Product " + it.getProductId() + " inventory " + before + " -> " + after, worker);
            events.inventory(it.getProductId(), after);   // real-time customer stock update
        }

        events.event(order.getId(), order.getPublicRef(),
                EventType.INVENTORY_LOCK_RELEASED, "Lock released (committed)", worker);
        return Result.SUCCESS;
    }

    public int quantityOf(Long productId) {
        return inventoryRepo.findByProductId(productId).map(Inventory::getQuantity).orElse(0);
    }

    @Transactional
    public void setQuantity(Long productId, int qty) {
        inventoryRepo.findByProductId(productId).ifPresent(inv -> {
            inv.setQuantity(qty);
            inventoryRepo.save(inv);
        });
        events.inventory(productId, qty);
    }
}
