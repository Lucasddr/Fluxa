package com.fluxa.backend.dto.request.update;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateTransactionDTO(
        @NotNull(message = "categoryId é obrigatório")
        UUID categoryId,

        @NotNull(message = "CategoryKind é obrigatório")
        CategoryKind kind,

        @NotNull(message = "Valor é obrigatório")
        @Positive(message = "Valor deve ser maior que zero")
        BigDecimal amount,

        @NotBlank(message = "Nome é obrigatório")
        String description,

        @NotNull(message = "Data é obrigatória")
        LocalDate occurredAt,

        String observation,

        @NotNull(message = "Método de pagamento é obrigatório")
        PaymentMethods paymentMethod,

        @NotNull(message = "Recorrência é obrigatória")
        Boolean recurring
) {
}
