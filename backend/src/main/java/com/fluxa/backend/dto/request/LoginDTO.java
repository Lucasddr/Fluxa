package com.fluxa.backend.dto.request;

public record LoginDTO(
        String email,
        String password
) {
}
