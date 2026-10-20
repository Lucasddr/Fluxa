package com.fluxa.backend.dto.request.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PreviewStatementTextDTO(
        @NotBlank(message = "Cole o texto do extrato.")
        @Size(max = 1_000_000, message = "O texto do extrato deve ter no máximo 1 MB.")
        String text
) {
}
