package com.fluxa.backend.dto.response;

import java.util.UUID;

public record AccountResponseDTO(
        UUID id,
        String name,
        String currency,
        boolean isDefault
) {
}
