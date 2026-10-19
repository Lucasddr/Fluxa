package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.create.CreateAccountDTO;
import com.fluxa.backend.dto.request.update.UpdateAccountDTO;
import com.fluxa.backend.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/accounts")
public class AccountController {
    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<?> listAccounts() {
        return ResponseEntity.ok(accountService.listAccounts());
    }

    @PostMapping
    public ResponseEntity<?> createAccount(@Valid @RequestBody CreateAccountDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.createCustomAccount(dto));
    }

    @PatchMapping("/{accountId}")
    public ResponseEntity<?> updateAccount(
            @PathVariable UUID accountId,
            @Valid @RequestBody UpdateAccountDTO dto) {
        return ResponseEntity.ok(accountService.updateAccount(accountId, dto));
    }

    @PutMapping("/{accountId}/default")
    public ResponseEntity<?> setDefaultAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(accountService.setDefaultAccount(accountId));
    }

    @DeleteMapping("/{accountId}")
    public ResponseEntity<?> deleteAccount(@PathVariable UUID accountId) {
        accountService.deleteAccount(accountId);
        return ResponseEntity.ok(Map.of("message", "Conta excluída com sucesso."));
    }

}
