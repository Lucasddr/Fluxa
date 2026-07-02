package com.fluxa.backend.dto.response;

import java.math.BigDecimal;

public record EconomyCardDTO(
        String type,
        Integer savingsPercentage,
        BigDecimal savedAmount,
        BigDecimal totalIncome,
        Integer goalPercentage
) {
}
