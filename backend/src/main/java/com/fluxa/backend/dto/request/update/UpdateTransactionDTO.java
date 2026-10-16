package com.fluxa.backend.dto.request.update;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateTransactionDTO(
        @NotNull(message = "categoryId é obrigatório")
        UUID categoryId,

        @NotNull(message = "Valor é obrigatório")
        @Positive(message = "Valor deve ser maior que zero")
        BigDecimal amount,

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String description,

        @NotNull(message = "Data é obrigatória")
        LocalDate occurredAt,

        @Size(max = 2000, message = "Observação deve ter no máximo 2000 caracteres")
        String observation,

        @NotNull(message = "Método de pagamento é obrigatório")
        PaymentMethods paymentMethod,

        @NotNull(message = "Recorrência é obrigatória")
        Boolean recurring
) {
}
