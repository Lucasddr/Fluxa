package com.fluxa.backend.dto.request.create;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ImportStatementDTO(
        @NotEmpty(message = "Selecione ao menos uma movimentação para importar.")
        @Size(max = 5_000, message = "É possível importar até 5.000 movimentações por vez.")
        List<@Valid ImportedStatementTransactionDTO> transactions,

        @Digits(integer = 10, fraction = 2, message = "O saldo do extrato deve ter no máximo duas casas decimais")
        BigDecimal statementBalance,

        LocalDate statementBalanceAsOf
) {
}
