package com.fluxa.backend.exception;

public class InstallmentAlreadyPaidException extends RuntimeException {
    public InstallmentAlreadyPaidException() {
        super("Parcela já foi paga");
    }
}
