package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.CreateTransactionDTO;
import com.fluxa.backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    public  ResponseEntity<?> listTransactions (Pageable pageable) {

        return ResponseEntity.ok(
            transactionService.listTransactions(pageable)
        );
    }
}
