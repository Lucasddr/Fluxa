package com.fluxa.backend.exception;

public class InvalidInstallmentsSumException extends RuntimeException {
    public InvalidInstallmentsSumException() {
        super("Soma das parcelas deve ser igual ao valor total da compra");
    }
}
