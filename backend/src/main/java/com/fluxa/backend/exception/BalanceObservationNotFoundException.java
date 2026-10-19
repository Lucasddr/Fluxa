package com.fluxa.backend.exception;

public class BalanceObservationNotFoundException extends RuntimeException {
    public BalanceObservationNotFoundException() {
        super("Conferência de saldo não encontrada.");
    }
}
