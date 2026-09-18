package com.fluxa.backend.dto.request.patch;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PatchAccountCurrentBalanceDTO(
        @NotNull
        BigDecimal amount
) {
}
