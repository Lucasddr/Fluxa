package com.fluxa.backend.dto.internal;

public record TokenPair(
        String jwtToken,
        String refreshToken
) {
}
