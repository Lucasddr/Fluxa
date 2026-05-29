package com.fluxa.backend.dto.response;

public record LoginResponseDTO(
        String token,
        String accountId
) {
}
