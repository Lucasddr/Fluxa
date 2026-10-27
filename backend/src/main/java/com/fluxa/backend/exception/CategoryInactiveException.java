package com.fluxa.backend.exception;

public class CategoryInactiveException extends RuntimeException {
    public CategoryInactiveException() {
        super("Categoria desativada não pode ser usada em novas movimentações ou compras no crédito");
    }
}
