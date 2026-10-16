package com.fluxa.backend.dto.request.update;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateCreditPurchaseDTO(

        @Size(max = 120, message = "Título deve ter no máximo 120 caracteres")
        String title,

        @Size(max = 120, message = "Estabelecimento deve ter no máximo 120 caracteres")
        String merchant,

        UUID categoryId,

        @Size(max = 250, message = "Observações devem ter no máximo 250 caracteres")
        String notes
) {
}
