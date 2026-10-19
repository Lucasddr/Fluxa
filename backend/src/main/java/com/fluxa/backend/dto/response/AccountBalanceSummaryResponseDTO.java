package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.BalanceTrustStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AccountBalanceSummaryResponseDTO(
        UUID accountId,
        String accountName,
        UUID latestObservationId,
        BigDecimal currentBalance,
        BigDecimal ledgerBalance,
        BigDecimal observedBalance,
        BigDecimal difference,
        LocalDate balanceAsOf,
        OffsetDateTime recordedAt,
        BalanceTrustStatus status,
        int pendingReviewCount
) {
}
