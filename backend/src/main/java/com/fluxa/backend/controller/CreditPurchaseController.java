package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.update.UpdateCreditPurchaseDTO;
import com.fluxa.backend.service.CreditPurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/credit-purchases")
public class CreditPurchaseController {

    private final CreditPurchaseService creditPurchaseService;

    @PostMapping("/create")
    public ResponseEntity<?> createCreditPurchase(
            @Valid @RequestBody CreateCreditPurchaseDTO dto) {

        UUID purchaseId = creditPurchaseService.createCreditPurchase(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Compra parcelada criada com sucesso",
                "creditPurchaseId", purchaseId));
    }

    @GetMapping("/list")
    public ResponseEntity<?> listCreditPurchases(Pageable pageable) {

        return ResponseEntity.ok(
                creditPurchaseService.listCreditPurchases(pageable));
    }

    @GetMapping("/{purchaseId}")
    public ResponseEntity<?> getCreditPurchaseDetails(@PathVariable UUID purchaseId) {

        return ResponseEntity.ok(
                creditPurchaseService.getCreditPurchaseDetails(purchaseId));
    }

    @PatchMapping("/{purchaseId}")
    public ResponseEntity<?> updateCreditPurchase(
            @PathVariable UUID purchaseId,
            @Valid @RequestBody UpdateCreditPurchaseDTO dto) {

        creditPurchaseService.updateCreditPurchase(purchaseId, dto);

        return ResponseEntity.ok(
                Map.of("message", "Compra atualizada com sucesso"));
    }

    @DeleteMapping("/{purchaseId}")
    public ResponseEntity<?> deleteCreditPurchase(@PathVariable UUID purchaseId) {

        creditPurchaseService.deleteCreditPurchase(purchaseId);

        return ResponseEntity.ok(
                Map.of("message", "Compra excluída com parcelas e lançamentos gerados"));
    }
}
