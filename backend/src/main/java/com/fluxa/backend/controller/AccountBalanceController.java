package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.create.CreateBalanceObservationDTO;
import com.fluxa.backend.dto.request.update.ResolveBalanceObservationDTO;
import com.fluxa.backend.service.AccountBalanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/accounts")
public class AccountBalanceController {

    private final AccountBalanceService accountBalanceService;

    @GetMapping("/balances")
    public ResponseEntity<?> listBalanceSummaries() {
        return ResponseEntity.ok(accountBalanceService.listAccountSummaries());
    }

    @GetMapping("/{accountId}/balance")
    public ResponseEntity<?> getBalanceSummary(@PathVariable UUID accountId) {
        return ResponseEntity.ok(accountBalanceService.getAccountSummary(accountId));
    }

    @GetMapping("/{accountId}/balance-observations")
    public ResponseEntity<?> listObservations(@PathVariable UUID accountId) {
        return ResponseEntity.ok(accountBalanceService.listObservations(accountId));
    }

    @PostMapping("/{accountId}/balance-observations")
    public ResponseEntity<?> createManualObservation(
            @PathVariable UUID accountId,
            @Valid @RequestBody CreateBalanceObservationDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountBalanceService.createManualObservation(accountId, dto));
    }

    @PostMapping("/{accountId}/balance-observations/{observationId}/resolve")
    public ResponseEntity<?> resolveObservation(
            @PathVariable UUID accountId,
            @PathVariable UUID observationId,
            @Valid @RequestBody ResolveBalanceObservationDTO dto) {
        return ResponseEntity.ok(accountBalanceService.resolveObservation(
                accountId, observationId, dto));
    }

}
