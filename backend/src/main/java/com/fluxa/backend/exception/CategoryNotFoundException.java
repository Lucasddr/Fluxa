package com.fluxa.backend.exception;

public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException() {super("Categoria não encontrada");
    }
}
