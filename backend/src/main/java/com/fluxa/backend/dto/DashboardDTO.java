package com.fluxa.backend.dto;

import org.springframework.cglib.core.Local;

import java.time.LocalDate;

public record DashboardDTO(
        LocalDate start,
        LocalDate end
) {
}
