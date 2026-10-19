package com.fluxa.backend.dto.response;

import java.math.BigDecimal;

public record StatementPreviewRowDTO(
        int rowNumber,
        String sourceReference,
        String occurredAt,
        String description,
        BigDecimal signedAmount,
        boolean duplicate,
        String suggestedCategoryId
) {
}
