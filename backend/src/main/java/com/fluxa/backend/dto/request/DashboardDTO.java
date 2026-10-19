package com.fluxa.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DashboardDTO(
        @NotNull(message = "Data de inicío é obrigatória")
        LocalDate start,

        @NotNull(message = "Data final é obrigatória")
        LocalDate end,

        int horizonDays
) {
    public DashboardDTO(LocalDate start, LocalDate end) {
        this(start, end, 30);
    }
}
