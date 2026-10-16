package com.fluxa.backend.dto.response;

import com.fluxa.backend.domain.enums.InstallmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InstallmentResponseDTO(
        UUID id,
        UUID creditPurchaseId,
        String creditPurchaseTitle,
        Integer number,
        Integer installmentsQty,
        LocalDate dueDate,
        BigDecimal amount,
        InstallmentStatus status
) {
}
