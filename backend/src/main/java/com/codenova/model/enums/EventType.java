package com.codenova.model.enums;

/** Every meaningful step in an order's life. Persisted to order_events and streamed over WebSocket. */
public enum EventType {
    ORDER_CREATED,
    ORDER_QUEUED,
    WORKER_ASSIGNED,
    PROCESSING_STARTED,
    INVENTORY_LOCK_REQUESTED,
    INVENTORY_LOCK_ACQUIRED,
    INVENTORY_CHECKED,
    INVENTORY_DEDUCTED,
    INVENTORY_LOCK_RELEASED,
    ORDER_SUCCESS,
    ORDER_FAILED,
    RETRY_STARTED,
    RETRY_FAILED,
    RETRY_SUCCESS,
    ORDER_MOVED_TO_DLQ
}
