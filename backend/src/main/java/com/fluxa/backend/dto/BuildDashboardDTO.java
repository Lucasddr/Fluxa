package com.fluxa.backend.dto;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;

public record BuildDashboardDTO(
    String user,
    String accountName,

    BigDecimal entry,
    BigDecimal expenses,
    BigDecimal accountsPayable,
    BigDecimal monthlyBalance
) {
}
