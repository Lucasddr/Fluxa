package com.fluxa.backend.exception;

public class InstallmentNotFoundException extends RuntimeException {
    public InstallmentNotFoundException() {
        super("Parcela não encontrada");
    }
}
