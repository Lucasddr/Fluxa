package com.fluxa.backend.dto.request.create;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ImportedStatementTransactionDTO(
        @NotBlank(message = "Referência de origem é obrigatória")
        @Size(max = 128)
        String sourceReference,

        @NotNull(message = "Data é obrigatória")
        LocalDate occurredAt,

        @NotNull(message = "Valor é obrigatório")
        @Digits(integer = 10, fraction = 2, message = "Valor deve ter no máximo duas casas decimais")
        BigDecimal signedAmount,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 200, message = "Descrição deve ter no máximo 200 caracteres")
        String description,

        @NotNull(message = "Categoria é obrigatória")
        UUID categoryId
) {
}
