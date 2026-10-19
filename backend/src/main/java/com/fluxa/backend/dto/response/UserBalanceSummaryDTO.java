package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.BalanceTrustStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserBalanceSummaryDTO(
        BigDecimal currentBalance,
        BigDecimal ledgerBalance,
        BigDecimal pendingDifference,
        LocalDate balanceAsOf,
        BalanceTrustStatus status,
        int pendingReviewCount
) {
}
