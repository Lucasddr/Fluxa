package com.fluxa.backend.controller;

import com.fluxa.backend.dto.CreateTransactionDTO;
import com.fluxa.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/transactions")
public class TransactionController {

    public final TransactionService transactionService;

    @PostMapping("/create")
    public ResponseEntity<?> createTransaction (@RequestBody CreateTransactionDTO dto){

        transactionService.createTransaction(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "transaction created"));
    }
}
