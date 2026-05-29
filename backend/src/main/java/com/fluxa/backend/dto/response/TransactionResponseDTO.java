package com.fluxa.backend.dto;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponseDTO(
        UUID id,
        BigDecimal amount,
        String title,
        String subtitle,
        String category,
        CategoryKind kind,
        LocalDate date,
        PaymentMethods paymentMethods
        ) {}
