package com.fluxa.backend.dto.request.create;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateBalanceObservationDTO(
        @NotNull(message = "Informe o saldo observado")
        @Digits(integer = 10, fraction = 2, message = "Saldo com no máximo 2 casas decimais")
        BigDecimal observedBalance,

        @NotNull(message = "Informe a data a que o saldo se refere")
        LocalDate balanceAsOf
) {
}
