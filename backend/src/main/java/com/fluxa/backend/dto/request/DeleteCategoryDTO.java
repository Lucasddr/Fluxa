package com.fluxa.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DeleteCategoryDTO(
        @NotNull(message = "categoryId é obrigatório")
        UUID categoryId
) {
}
