package com.codenova.service;

/** A retryable technical failure (e.g. simulated DB timeout). Business failures do NOT use this. */
public class TechnicalProcessingException extends RuntimeException {
    public TechnicalProcessingException(String message) { super(message); }
}
