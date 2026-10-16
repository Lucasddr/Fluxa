package com.fluxa.backend.dto.request.create;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateCreditPurchaseDTO(

        @NotBlank(message = "Título é obrigatório")
        @Size(max = 120, message = "Título deve ter no máximo 120 caracteres")
        String title,

        @Size(max = 120, message = "Estabelecimento deve ter no máximo 120 caracteres")
        String merchant,

        @NotNull(message = "Valor total é obrigatório")
        @Positive(message = "Valor total deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Valor total com no máximo 2 casas decimais")
        BigDecimal totalAmount,

        @NotNull(message = "Data da compra é obrigatória")
        LocalDate purchaseDate,

        @NotNull(message = "Quantidade de parcelas é obrigatória")
        @Min(value = 1, message = "Quantidade mínima é 1 parcela")
        @Max(value = 120, message = "Quantidade máxima é 120 parcelas")
        Integer installmentsQty,

        @NotNull(message = "Primeiro vencimento é obrigatório")
        LocalDate firstDueDate,

        @NotNull(message = "Categoria é obrigatória")
        UUID categoryId,

        @Size(max = 250, message = "Observações devem ter no máximo 250 caracteres")
        String notes,

        /**
         * Modo manual: lista com UMA entrada por parcela (na ordem, número
         * atribuído 1..N), cada uma com valor e vencimento próprios.
         * Nulo ou vazio = modo automático (total dividido em partes iguais,
         * vencimentos mensais a partir de firstDueDate, centavos no último).
         * No modo manual a soma deve ser igual ao totalAmount (400 se divergir).
         */
        @Size(max = 120, message = "Máximo de 120 parcelas manuais")
        List<@Valid ManualInstallmentDTO> installments
) {
    public record ManualInstallmentDTO(
            @NotNull(message = "Valor da parcela é obrigatório")
            @Positive(message = "Valor da parcela deve ser maior que zero")
            @Digits(integer = 10, fraction = 2, message = "Valor da parcela com no máximo 2 casas decimais")
            BigDecimal amount,

            @NotNull(message = "Vencimento da parcela é obrigatório")
            LocalDate dueDate
    ) {
    }
}
