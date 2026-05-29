package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.CategoryKind;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DashboardRecentTransactionResponseDTO(
        UUID id,
        BigDecimal amount,
        String title,
        CategoryKind kind,
        String date
) {
}
