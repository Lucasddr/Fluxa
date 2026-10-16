package com.fluxa.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordDTO(
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        String email
) {
}
