package com.fluxa.backend.exception;

public class InvalidBalanceObservationException extends RuntimeException {
    public InvalidBalanceObservationException(String message) {
        super(message);
    }
}
