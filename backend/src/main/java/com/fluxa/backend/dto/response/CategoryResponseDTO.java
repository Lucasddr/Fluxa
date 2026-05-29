package com.fluxa.backend.dto.response;

import java.util.UUID;

public record CategoryResponseDTO(
        UUID id,
        String name,
        String kind,
        String icon,
        String color,
        String description,
        Boolean status
) {
}
