package com.fluxa.backend.dto;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(
    String user,
    String accountName,

    BigDecimal entry,
    BigDecimal expenses,
    BigDecimal accountsPayable,
    BigDecimal monthlyBalance,

    List<TransactionDTO> recentlyTransactions
) {
}
