package com.fluxa.backend.dto.request;

import com.fluxa.backend.domain.enums.CategoryKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCategoryDTO(
        @NotBlank(message = "Nome é obrigatório")
        String name,

        @NotNull(message = "Tipo da categoria é obrigatório")
        CategoryKind kind,

        @NotBlank(message = "Icon é obrigatório")
        String icon,

        String description,

        @NotBlank(message = "Cor é obrigatória")
        String color,

        @NotNull(message = "Status é obrigatório")
        Boolean status
) {
}
