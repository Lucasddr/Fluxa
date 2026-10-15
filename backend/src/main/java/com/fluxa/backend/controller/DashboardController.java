package com.fluxa.backend.controller;


import com.fluxa.backend.dto.request.DashboardDTO;
import com.fluxa.backend.dto.response.BuildDashboardResponseDTO;
import com.fluxa.backend.service.DashboardService;
import com.fluxa.backend.service.InsightAggregatorService;
import com.fluxa.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final TransactionService transactionService;
    private final InsightAggregatorService insightAggregatorService;

    @GetMapping("/buildDashboard")
    public ResponseEntity<?> buildDashboard (
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
            ) {

        String rangeError = validateRange(start, end);

        if (rangeError != null) {
            return ResponseEntity.badRequest().body(
                    java.util.Map.of("message", rangeError)
            );
        }

        DashboardDTO dto = new DashboardDTO(start, end);

        return ResponseEntity.ok(
               dashboardService.buildDashboardDTO(dto)
        );
    }

    @GetMapping("/recentTransactions")
    public ResponseEntity<?> recentTransactions(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end
    ) {

        String rangeError = validateOptionalRange(start, end);

        if (rangeError != null) {
            return ResponseEntity.badRequest().body(
                    java.util.Map.of("message", rangeError)
            );
        }

        return ResponseEntity.ok(
                transactionService.listRecentTransactions(start, end)
        );

    }

    @GetMapping("/insightCards")
    public ResponseEntity<?> getInsightCards(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end
    ) {

        String rangeError = validateOptionalRange(start, end);

        if (rangeError != null) {
            return ResponseEntity.badRequest().body(
                    java.util.Map.of("message", rangeError)
            );
        }

        List<Object> cards = insightAggregatorService.getInsightCards(start, end);

        return ResponseEntity.ok(cards);
    }

    private static String validateRange(LocalDate start, LocalDate end) {
        if (start.isAfter(end)) {
            return "start deve ser anterior ou igual a end";
        }

        if (start.plusDays(366).isBefore(end)) {
            return "intervalo máximo permitido: 366 dias";
        }

        return null;
    }

    private static String validateOptionalRange(LocalDate start, LocalDate end) {
        if ((start == null) != (end == null)) {
            return "start e end devem ser informados juntos";
        }

        if (start != null) {
            return validateRange(start, end);
        }

        return null;
    }
}
