package com.fluxa.backend.exception;

public class AccountNotFoundException extends RuntimeException {
    public AccountNotFoundException() {super("Conta não encontrada");
    }
}
