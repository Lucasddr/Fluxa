package com.fluxa.backend.exception;

public class CategoryInUseException extends RuntimeException {
    public CategoryInUseException() {
        super("Categoria possui transações vinculadas e não pode ser excluída");
    }
}
