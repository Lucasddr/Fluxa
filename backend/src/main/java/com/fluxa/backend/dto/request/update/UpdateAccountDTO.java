package com.fluxa.backend.dto.request.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAccountDTO(
        @NotBlank(message = "Nome da conta é obrigatório")
        @Size(max = 100, message = "Nome da conta deve ter no máximo 100 caracteres")
        String name
) {
}
