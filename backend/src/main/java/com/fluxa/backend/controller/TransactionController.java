package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import com.fluxa.backend.dto.request.update.UpdateTransactionDTO;
import com.fluxa.backend.service.TransactionService;
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
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/create")
    public ResponseEntity<?> createTransaction (@Valid @RequestBody CreateTransactionDTO dto){

        transactionService.createTransaction(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "transaction created"));
    }

    @GetMapping("/list")
    public ResponseEntity<?> listTransactions (Pageable pageable) {

        return ResponseEntity.ok(
            transactionService.listTransactions(pageable)
        );
    }

    @PatchMapping("/{transactionId}")
    public ResponseEntity<?> updateTransaction(@PathVariable UUID transactionId,
                                               @Valid @RequestBody UpdateTransactionDTO dto) {

        transactionService.updateTransaction(transactionId, dto);

        return ResponseEntity.ok(
                Map.of("message", "transação editada com sucesso")
        );
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<?> deleteTransaction(@PathVariable UUID transactionId) {

        transactionService.deleteTransaction(transactionId);

        return ResponseEntity.ok(
                Map.of("message", "Transação excluída com sucesso")
        );
    }
}
