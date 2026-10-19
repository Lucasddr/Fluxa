package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.ImportedStatementEntry;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.create.ImportStatementDTO;
import com.fluxa.backend.dto.request.create.ImportedStatementTransactionDTO;
import com.fluxa.backend.dto.response.StatementImportResultDTO;
import com.fluxa.backend.dto.response.StatementPreviewResponseDTO;
import com.fluxa.backend.dto.response.StatementPreviewRowDTO;
import com.fluxa.backend.exception.AccountNotFoundException;
import com.fluxa.backend.exception.CategoryNotFoundException;
import com.fluxa.backend.exception.InvalidStatementFileException;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.ImportedStatementEntryRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class BankStatementImportService {
    private final BankStatementParser parser;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final ImportedStatementEntryRepository importEntryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AccountBalanceService accountBalanceService;

    @Transactional(readOnly = true)
    public StatementPreviewResponseDTO preview(UUID accountId, MultipartFile file) {
        UUID userId = UserContext.getUserId();
        findOwnedAccount(accountId, userId);
        if (file == null || file.isEmpty()) {
            throw new InvalidStatementFileException("Escolha um arquivo CSV ou OFX.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new InvalidStatementFileException("O arquivo deve ter no máximo 5 MB.");
        }

        final BankStatementParser.ParsedStatement parsed;
        try {
            parsed = parser.parse(file.getOriginalFilename(), file.getBytes());
        } catch (IOException exception) {
            throw new InvalidStatementFileException("Não foi possível ler o arquivo enviado.");
        }

        Set<String> existingReferences = new HashSet<>(importEntryRepository.findExistingSourceReferences(
                accountId, parsed.rows().stream().map(StatementPreviewRowDTO::sourceReference).toList()));
        Set<String> referencesInFile = new HashSet<>();
        List<StatementPreviewRowDTO> rows = parsed.rows().stream().map(row -> {
            boolean repeatedInFile = !referencesInFile.add(row.sourceReference());
            return new StatementPreviewRowDTO(
                    row.rowNumber(), row.sourceReference(), row.occurredAt(), row.description(),
                    row.signedAmount(), repeatedInFile || existingReferences.contains(row.sourceReference()));
        }).toList();
        return new StatementPreviewResponseDTO(
                parsed.format(), rows, parsed.statementBalance(), parsed.statementBalanceAsOf());
    }

    @Transactional
    public StatementImportResultDTO importSelected(UUID accountId, ImportStatementDTO dto) {
        UUID userId = UserContext.getUserId();
        Account account = accountRepository.lockByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);
        User user = userRepository.findById(userId).orElseThrow(AccountNotFoundException::new);
        if ((dto.statementBalance() == null) != (dto.statementBalanceAsOf() == null)) {
            throw new InvalidStatementFileException(
                    "O saldo do extrato precisa incluir valor e data juntos.");
        }
        if (dto.statementBalanceAsOf() != null
                && dto.statementBalanceAsOf().isAfter(LocalDate.now())) {
            throw new InvalidStatementFileException("A data do saldo do extrato não pode estar no futuro.");
        }

        int imported = 0;
        int duplicates = 0;
        Set<String> seenReferences = new HashSet<>(importEntryRepository.findExistingSourceReferences(
                accountId, dto.transactions().stream()
                        .map(ImportedStatementTransactionDTO::sourceReference).toList()));
        for (ImportedStatementTransactionDTO item : dto.transactions()) {
            if (!seenReferences.add(item.sourceReference())) {
                duplicates++;
                continue;
            }
            if (item.signedAmount().signum() == 0) {
                throw new InvalidStatementFileException("Uma movimentação selecionada tem valor zero.");
            }
            if (item.occurredAt().isAfter(LocalDate.now())) {
                throw new InvalidStatementFileException("Movimentações futuras não podem ser importadas.");
            }

            CategoryKind kind = item.signedAmount().signum() > 0
                    ? CategoryKind.INCOME
                    : CategoryKind.EXPENSE;
            Category category = categoryRepository.findByIdAndUserId(item.categoryId(), userId)
                    .filter(Category::isActive)
                    .orElseThrow(CategoryNotFoundException::new);
            if (category.getKind() != kind) {
                throw new InvalidStatementFileException(
                        "A categoria escolhida precisa ser do tipo "
                                + (kind == CategoryKind.INCOME ? "receita." : "despesa."));
            }

            Transaction transaction = new Transaction();
            transaction.setUser(user);
            transaction.setAccount(account);
            transaction.setCategory(category);
            transaction.setKind(kind);
            transaction.setAmount(item.signedAmount().abs());
            transaction.setDescription(item.description().trim());
            transaction.setOccurredAt(item.occurredAt());
            transaction.setPaymentMethod(PaymentMethods.OTHER);
            transaction.setRecurrent(false);
            transaction = transactionRepository.saveAndFlush(transaction);

            ImportedStatementEntry importEntry = new ImportedStatementEntry();
            importEntry.setUser(user);
            importEntry.setAccount(account);
            importEntry.setTransaction(transaction);
            importEntry.setSourceReference(item.sourceReference());
            importEntryRepository.saveAndFlush(importEntry);

            accountBalanceService.markPendingReviewForLedgerChange(
                    accountId, userId, transaction.getOccurredAt(), transaction.getCreatedAt());
            imported++;
        }

        boolean statementBalanceRecorded = false;
        if (imported > 0 && dto.statementBalance() != null && dto.statementBalanceAsOf() != null) {
            accountBalanceService.createStatementObservation(
                    accountId, dto.statementBalance(), dto.statementBalanceAsOf());
            statementBalanceRecorded = true;
        }

        return new StatementImportResultDTO(imported, duplicates, statementBalanceRecorded);
    }

    private Account findOwnedAccount(UUID accountId, UUID userId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);
    }
}
