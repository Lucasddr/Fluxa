package com.fluxa.backend.exception;

public class CreditPurchaseNotFoundException extends RuntimeException {
    public CreditPurchaseNotFoundException() {
        super("Compra parcelada não encontrada");
    }
}
