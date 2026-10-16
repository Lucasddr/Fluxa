package com.fluxa.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreditPurchaseDetailsResponseDTO(
        UUID id,
        String title,
        String merchant,
        BigDecimal totalAmount,
        LocalDate purchaseDate,
        Integer installmentsQty,
        LocalDate firstDueDate,
        UUID categoryId,
        String categoryName,
        String notes,
        long pendingCount,
        long paidCount,
        long generatedTransactionsCount,
        List<InstallmentResponseDTO> installments
) {
}
