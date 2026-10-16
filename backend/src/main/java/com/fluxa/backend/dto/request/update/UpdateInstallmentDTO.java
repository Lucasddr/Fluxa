package com.fluxa.backend.dto.request.update;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateInstallmentDTO(

        @Positive(message = "Valor da parcela deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Valor da parcela com no máximo 2 casas decimais")
        BigDecimal amount,

        LocalDate dueDate
) {
}
