package com.fluxa.backend.dto.request;

import java.time.LocalDate;

public record DashboardDTO(
        LocalDate start,
        LocalDate end
) {
}
