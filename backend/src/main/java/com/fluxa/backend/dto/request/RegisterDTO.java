package com.fluxa.backend.dto.request;

public record RegisterDTO(
        String name,
        String email,
        String password
) {}
