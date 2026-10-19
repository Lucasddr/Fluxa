package com.fluxa.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StatementPreviewResponseDTO(
        String format,
        List<StatementPreviewRowDTO> rows,
        BigDecimal statementBalance,
        String statementBalanceAsOf
) {
}
