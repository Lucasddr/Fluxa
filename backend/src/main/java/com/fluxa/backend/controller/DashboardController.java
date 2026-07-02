package com.fluxa.backend.controller;


import com.fluxa.backend.dto.request.DashboardDTO;
import com.fluxa.backend.dto.response.BuildDashboardResponseDTO;
import com.fluxa.backend.service.DashboardService;
import com.fluxa.backend.service.InsightAggregatorService;
import com.fluxa.backend.service.InsightsService;
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

    public final DashboardService dashboardService;
    public final TransactionService transactionService;
    public final InsightAggregatorService insightAggregatorService;

    @GetMapping("/buildDashboard")
    public ResponseEntity<BuildDashboardResponseDTO> buildDashboard (
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
            ) {

        DashboardDTO dto = new DashboardDTO(start, end);

        return ResponseEntity.ok(
               dashboardService.buildDashboardDTO(dto)
        );
    }

    @GetMapping("/recentTransactions")
    public ResponseEntity<?> recentTransactions() {

        return ResponseEntity.ok(
                transactionService.listRecentTransactions()
        );

    }

    @GetMapping("/insightCards")
    public ResponseEntity<List<Object>> getInsightCards() {

        List<Object> cards = insightAggregatorService.getInsightCards();

        return ResponseEntity.ok(cards);
    }
}
