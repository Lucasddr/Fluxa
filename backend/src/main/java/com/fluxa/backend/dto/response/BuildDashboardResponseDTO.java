package com.fluxa.backend.dto.response;

import java.math.BigDecimal;

public record BuildDashboardResponseDTO(
        String user,
        String accountName,

        BigDecimal entry,
        BigDecimal expenses,
        BigDecimal accountsPayable,
        BigDecimal monthlyBalance
) {
}
