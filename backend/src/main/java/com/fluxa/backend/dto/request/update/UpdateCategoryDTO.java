package com.fluxa.backend.dto.request.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCategoryDTO(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String name,

        @NotBlank(message = "Icon é obrigatório")
        @Size(max = 255, message = "Icon deve ter no máximo 255 caracteres")
        String icon,

        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
        String description,

        @NotBlank(message = "Cor é obrigatória")
        @Size(max = 255, message = "Cor deve ter no máximo 255 caracteres")
        String color,

        @NotNull(message = "Status é obrigatório")
        Boolean status
) {
}
