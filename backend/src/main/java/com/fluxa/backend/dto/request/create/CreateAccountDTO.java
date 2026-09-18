package com.fluxa.backend.dto.request.create;

import jakarta.validation.constraints.NotBlank;

public record CreateAccountDTO(
        @NotBlank(message = "Nome é obrigatório")
        String name
) {}
