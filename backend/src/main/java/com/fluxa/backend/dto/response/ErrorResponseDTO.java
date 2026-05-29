package com.fluxa.backend.dto.response;

public record ErrorResponseDTO(
        int status,
        String message
) {
}
