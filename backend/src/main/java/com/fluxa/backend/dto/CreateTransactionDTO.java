package com.fluxa.backend.dto;

import com.fluxa.backend.domain.enums.CategoryKind;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTransactionDTO(
    UUID accountId,
    UUID categoryId,
    CategoryKind kind,
    BigDecimal amount,
    String description,
    LocalDate occurredAt
) {
}
