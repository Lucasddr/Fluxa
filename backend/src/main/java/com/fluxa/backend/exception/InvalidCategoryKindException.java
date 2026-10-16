package com.fluxa.backend.exception;

public class InvalidCategoryKindException extends RuntimeException {
    public InvalidCategoryKindException() {
        super("Compras parceladas exigem categoria de despesa (EXPENSE)");
    }
}
