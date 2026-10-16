package com.fluxa.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreditPurchaseResponseDTO(
        UUID id,
        String title,
        String merchant,
        BigDecimal totalAmount,
        LocalDate purchaseDate,
        Integer installmentsQty,
        LocalDate firstDueDate,
        UUID categoryId,
        String categoryName,
        long pendingCount,
        long paidCount
) {
}
