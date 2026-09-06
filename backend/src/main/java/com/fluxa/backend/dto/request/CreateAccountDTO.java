package com.fluxa.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateAccountDTO(
        @NotBlank(message = "Nome é obrigatório")
        String name
) {}
