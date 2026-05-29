package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ListTransactionResponseDTO(
        UUID id,
        BigDecimal amount,
        String title,
        String subtitle,
        CategoryKind kind,
        String date,
        String category,
        PaymentMethods paymentMethod,
        String dateLabel,
        String categoryColor
) {}

