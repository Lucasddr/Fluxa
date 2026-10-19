package com.fluxa.backend.service;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.BalanceObservationSource;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.dto.request.create.ImportStatementDTO;
import com.fluxa.backend.dto.request.create.ImportedStatementTransactionDTO;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BankStatementImportServiceTest {
    @Autowired private AuthService authService;
    @Autowired private AccountService accountService;
    @Autowired private BankStatementImportService importService;
    @Autowired private AccountBalanceService accountBalanceService;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;

    private UUID accountId;
    private UUID expenseCategoryId;

    @BeforeEach
    void setUp() {
        String email = "statement-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Statement User", email, "Teste1234"));
        UUID userId = userRepository.findByEmail(email).orElseThrow().getId();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        accountId = accountService.listAccounts().get(0).id();
        expenseCategoryId = categoryRepository
                .findCategoryByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 10))
                .stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst()
                .orElseThrow()
                .getId();
    }

    @Test
    void previewsCsvAndImportsItOnlyOnce() {
        String csv = "Data;Descrição;Valor\n"
                + LocalDate.now().minusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + ";Farmácia Loja 123;-42,90\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "movimentos.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        var preview = importService.preview(accountId, file);
        var row = preview.rows().get(0);
        var item = new ImportedStatementTransactionDTO(
                row.sourceReference(), LocalDate.parse(row.occurredAt()), row.signedAmount(),
                row.description(), expenseCategoryId, true);
        var request = new ImportStatementDTO(List.of(item), null, null);

        var firstImport = importService.importSelected(accountId, request);
        var secondImport = importService.importSelected(accountId, request);

        assertEquals("CSV", preview.format());
        assertEquals(1, firstImport.importedCount());
        assertEquals(0, firstImport.duplicateCount());
        assertEquals(1, firstImport.categoryRulesSaved());
        assertEquals(0, secondImport.importedCount());
        assertEquals(1, secondImport.duplicateCount());
        assertEquals(0, secondImport.categoryRulesSaved());
        assertEquals(1, transactionRepository.count());
        assertTrue(importService.preview(accountId, file).rows().get(0).duplicate());

        String recurringMerchantCsv = "Data;Descrição;Valor\n"
                + LocalDate.now().minusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + ";Farmácia Loja 456;-42,90\n";
        MockMultipartFile recurringMerchantFile = new MockMultipartFile(
                "file", "movimentos-2.csv", "text/csv", recurringMerchantCsv.getBytes(StandardCharsets.UTF_8));
        assertEquals(expenseCategoryId.toString(),
                importService.preview(accountId, recurringMerchantFile).rows().get(0).suggestedCategoryId());
    }

    @Test
    void importsOfxLedgerBalanceAsStatementObservation() {
        LocalDate statementDate = LocalDate.now().minusDays(1);
        String ofx = "OFXHEADER:100\n<OFX><BANKTRANLIST>"
                + "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>" + statementDate.toString().replace("-", "")
                + "120000<TRNAMT>-42.90<FITID>entry-balance-test<NAME>Farmácia</STMTTRN>"
                + "</BANKTRANLIST><LEDGERBAL><BALAMT>957.10<DTASOF>"
                + statementDate.toString().replace("-", "") + "120000</LEDGERBAL></OFX>";
        MockMultipartFile file = new MockMultipartFile(
                "file", "movimentos.ofx", "application/x-ofx", ofx.getBytes(StandardCharsets.UTF_8));

        var preview = importService.preview(accountId, file);
        var row = preview.rows().get(0);
        var request = new ImportStatementDTO(List.of(new ImportedStatementTransactionDTO(
                row.sourceReference(), LocalDate.parse(row.occurredAt()), row.signedAmount(),
                row.description(), expenseCategoryId, false)), preview.statementBalance(),
                LocalDate.parse(preview.statementBalanceAsOf()));

        var result = importService.importSelected(accountId, request);
        var observation = accountBalanceService.listObservations(accountId).get(0);

        assertEquals(1, result.importedCount());
        assertTrue(result.statementBalanceRecorded());
        assertEquals(BalanceObservationSource.STATEMENT, observation.source());
        assertEquals(new BigDecimal("957.10"), observation.observedBalance());
    }

    @Test
    void marksRepeatedOfxFitIdAsDuplicateInPreview() {
        String entry = "<STMTTRN><DTPOSTED>" + LocalDate.now().minusDays(1).toString().replace("-", "")
                + "120000<TRNAMT>-5.00<FITID>same-id-preview<NAME>Market</STMTTRN>";
        String ofx = "<OFX><BANKTRANLIST>" + entry + entry + "</BANKTRANLIST></OFX>";
        MockMultipartFile file = new MockMultipartFile(
                "file", "movimentos.ofx", "application/x-ofx", ofx.getBytes(StandardCharsets.UTF_8));

        var preview = importService.preview(accountId, file);

        assertEquals(2, preview.rows().size());
        assertFalse(preview.rows().get(0).duplicate());
        assertTrue(preview.rows().get(1).duplicate());
    }
}
