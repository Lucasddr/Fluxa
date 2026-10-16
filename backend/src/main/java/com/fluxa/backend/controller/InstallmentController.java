package com.fluxa.backend.controller;

import com.fluxa.backend.domain.enums.InstallmentStatus;
import com.fluxa.backend.dto.request.update.UpdateInstallmentDTO;
import com.fluxa.backend.service.InstallmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/installments")
public class InstallmentController {

    private final InstallmentService installmentService;

    @GetMapping("/list")
    public ResponseEntity<?> listInstallments(
            @RequestParam(required = false) InstallmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            Pageable pageable) {

        return ResponseEntity.ok(
                installmentService.listInstallments(status, start, end, pageable));
    }

    @GetMapping("/{installmentId}")
    public ResponseEntity<?> getInstallment(@PathVariable UUID installmentId) {

        return ResponseEntity.ok(
                installmentService.getInstallment(installmentId));
    }

    @PostMapping("/{installmentId}/pay")
    public ResponseEntity<?> payInstallment(
            @PathVariable UUID installmentId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        UUID transactionId = installmentService.payInstallment(installmentId, idempotencyKey);

        return ResponseEntity.ok(Map.of(
                "message", "Parcela paga com sucesso",
                "transactionId", transactionId));
    }

    @PatchMapping("/{installmentId}")
    public ResponseEntity<?> updateInstallment(
            @PathVariable UUID installmentId,
            @Valid @RequestBody UpdateInstallmentDTO dto,
            @RequestParam(defaultValue = "ONE") String scope) {

        installmentService.updateInstallment(installmentId, dto, scope);

        return ResponseEntity.ok(
                Map.of("message", "Parcela atualizada com sucesso"));
    }
}
