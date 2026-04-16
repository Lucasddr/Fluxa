package com.fluxa.backend.dto;

public record RegisterDTO(
        String name,
        String email,
        String password,
        String role
) {}
