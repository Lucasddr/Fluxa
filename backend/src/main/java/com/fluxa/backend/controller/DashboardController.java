package com.fluxa.backend.controller;


import com.fluxa.backend.dto.BuildDashboardDTO;
import com.fluxa.backend.dto.DashboardDTO;
import com.fluxa.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.cglib.core.Local;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RequiredArgsConstructor
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    public final DashboardService dashboardService;

    @GetMapping("/buildDashboard")
    public ResponseEntity<BuildDashboardDTO> buildDashboard (
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
                dashboardService.listRecentTransactions()
        );

    }
}
