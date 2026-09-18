package com.fluxa.backend.dto.response;

import java.util.List;

public record ErrorResponseDTO(
        int status,
        List<String> errors
) {
}
