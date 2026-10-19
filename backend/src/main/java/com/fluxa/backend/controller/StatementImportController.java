package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.create.ImportStatementDTO;
import com.fluxa.backend.dto.response.StatementImportResultDTO;
import com.fluxa.backend.dto.response.StatementPreviewResponseDTO;
import com.fluxa.backend.service.BankStatementImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/accounts/{accountId}/statement-imports")
public class StatementImportController {
    private final BankStatementImportService statementImportService;

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StatementPreviewResponseDTO> previewStatement(
            @PathVariable UUID accountId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(statementImportService.preview(accountId, file));
    }

    @PostMapping
    public ResponseEntity<StatementImportResultDTO> importStatement(
            @PathVariable UUID accountId,
            @Valid @RequestBody ImportStatementDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(statementImportService.importSelected(accountId, dto));
    }
}
