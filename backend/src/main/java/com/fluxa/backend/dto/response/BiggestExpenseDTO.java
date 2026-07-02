package com.fluxa.backend.dto.response;

import java.math.BigDecimal;

public record BiggestExpenseDTO(
        String type,
        String categoryName,
        BigDecimal totalSpent,
        Integer percentageOfExpenses,
        Integer suggestedReduction,
        BigDecimal savingIfReduced
) {
}
