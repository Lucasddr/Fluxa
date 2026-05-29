package com.fluxa.backend.dto.request;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTransactionDTO(
    UUID accountId,
    UUID categoryId,
    CategoryKind kind,
    BigDecimal amount,
    String description,
    LocalDate occurredAt,
    String observation,
    PaymentMethods paymentMethod,
    Boolean recurring
) {
}
