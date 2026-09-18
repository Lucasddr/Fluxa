package com.fluxa.backend.dto.request.update;

import com.fluxa.backend.domain.enums.CategoryKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateCategoryDTO(
        @NotBlank(message = "Nome é obrigatório")
        String name,

        @NotBlank(message = "Icon é obrigatório")
        String icon,

        String description,

        @NotBlank(message = "Cor é obrigatória")
        String color,

        @NotNull(message = "Status é obrigatório")
        Boolean status
) {
}
