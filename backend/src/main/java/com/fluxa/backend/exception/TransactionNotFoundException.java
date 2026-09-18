package com.fluxa.backend.exception;

public class TransactionNotFoundException extends RuntimeException {
    public TransactionNotFoundException() {super("Transação não encontrada");
    }
}
