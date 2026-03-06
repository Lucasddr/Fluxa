package com.fluxa.backend.dto;

import java.util.UUID;

public record ResponseRegisterDTO(
        UUID id,
        String name,
        String email
) {
}
