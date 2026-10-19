package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.BalanceObservationSource;
import com.fluxa.backend.domain.enums.BalanceObservationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BalanceObservationResponseDTO(
        UUID id,
        UUID accountId,
        BigDecimal observedBalance,
        BigDecimal ledgerBalance,
        BigDecimal difference,
        LocalDate balanceAsOf,
        OffsetDateTime recordedAt,
        BalanceObservationSource source,
        BalanceObservationStatus status,
        OffsetDateTime reviewedAt
) {
}
