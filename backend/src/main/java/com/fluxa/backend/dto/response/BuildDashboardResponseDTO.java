package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.BalanceTrustStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BuildDashboardResponseDTO(
        String user,
        String accountName,
        BigDecimal entry,
        BigDecimal expenses,
        BigDecimal accountsPayable,
        BigDecimal monthlyBalance,
        BigDecimal currentBalance,
        BigDecimal availableBalance,
        int forecastDays,
        BalanceTrustStatus balanceStatus,
        BigDecimal balanceDifference,
        LocalDate balanceAsOf,
        int pendingBalanceReviews
) {
}
