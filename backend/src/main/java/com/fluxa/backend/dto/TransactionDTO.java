package com.fluxa.backend.dto;

import java.math.BigDecimal;

public record TransactionDTO(
        String id,
        String title,
        BigDecimal amount,
        String date
) {}
