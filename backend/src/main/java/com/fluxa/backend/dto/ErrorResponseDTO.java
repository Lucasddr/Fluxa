package com.fluxa.backend.dto;

public record ErrorResponseDTO(
        int status,
        String message
) {
}
