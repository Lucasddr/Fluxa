package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.patch.PatchAccountCurrentBalanceDTO;
import com.fluxa.backend.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/account")
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/currentBalance")
    public ResponseEntity<?> getCurrentBalance() {

        BigDecimal currentBalance = accountService.getAccountCurrentBalance();

        return ResponseEntity.ok(Map.of("currentBalance", currentBalance));
    }

    @PatchMapping("/amount")
    public ResponseEntity<?> updateCurrentBalance(@RequestBody PatchAccountCurrentBalanceDTO dto) {

        log.info("[ACCOUNT] Valor para update no currentBalance : {}", dto.amount());

        accountService.updateAccountCurrentBalance(dto.amount());

        return ResponseEntity.ok(Map.of("message", "Valor da conta atualizado com sucesso!"));
    }


}
