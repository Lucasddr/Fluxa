package com.fluxa.backend.exception;

public class InvalidStatementFileException extends RuntimeException {
    public InvalidStatementFileException(String message) {
        super(message);
    }
}
