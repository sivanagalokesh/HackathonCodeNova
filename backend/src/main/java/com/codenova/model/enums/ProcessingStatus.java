package com.codenova.model.enums;

/** Internal technical processing status shown in the Operations Center. */
public enum ProcessingStatus {
    PENDING, QUEUED, PROCESSING, SUCCESS, FAILED, RETRYING, DEAD_LETTER
}
