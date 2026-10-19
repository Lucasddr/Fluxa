package com.fluxa.backend.dto.request.update;

import com.fluxa.backend.domain.enums.BalanceResolution;
import jakarta.validation.constraints.NotNull;

public record ResolveBalanceObservationDTO(
        @NotNull(message = "Escolha como resolver a divergência")
        BalanceResolution resolution
) {
}
