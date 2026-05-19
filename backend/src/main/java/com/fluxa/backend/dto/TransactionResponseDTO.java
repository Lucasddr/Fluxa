package com.fluxa.backend.dto;

import com.fluxa.backend.domain.enums.CategoryKind;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponseDTO(
        UUID id,
        BigDecimal amount,
        String title,
        CategoryKind kind,
        LocalDate date,
        String account,
        String categoryName
) {}
