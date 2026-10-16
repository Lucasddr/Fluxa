package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import com.fluxa.backend.dto.request.update.UpdateTransactionDTO;
import com.fluxa.backend.dto.response.DashboardRecentTransactionResponseDTO;
import com.fluxa.backend.dto.response.ListTransactionResponseDTO;
import com.fluxa.backend.dto.response.TransactionDetailsResponseDTO;
import com.fluxa.backend.exception.CategoryNotFoundException;
import com.fluxa.backend.exception.TransactionNotFoundException;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import com.fluxa.backend.util.Formatters;
import com.fluxa.backend.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class TransactionService {

    public final AccountRepository accountRepository;
    public final CategoryRepository categoryRepository;
    public final TransactionRepository transactionRepository;
    public final UserRepository userRepository;


    public boolean createTransaction(CreateTransactionDTO dto, String idempotencyKey){

        UUID userId = UserContext.getUserId();

        String key = idempotencyKey != null && !idempotencyKey.isBlank()
                ? idempotencyKey
                : null;

        if (key != null && transactionRepository
                .findByUserIdAndIdempotencyKey(userId, key)
                .isPresent()) {
            log.warn("[TRANSACTION] duplicate idempotency key ignored | user: {}",
                    userId);

            return false;
        }

        UUID accountId = accountRepository.findByUserId(userId);

        Account account = accountRepository.findByIdAndUserId(accountId,userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate occurredAt =
                LocalDate.from(dto.occurredAt().atStartOfDay());

        boolean duplicate = transactionRepository
                .existsByUserIdAndAmountAndDescriptionAndOccurredAtAndPaymentMethodAndCategory_IdAndCreatedAtAfter(
                        userId,
                        dto.amount(),
                        dto.description(),
                        occurredAt,
                        dto.paymentMethod(),
                        category.getId(),
                        OffsetDateTime.now().minusSeconds(10)
                );

        if (duplicate) {
            log.warn("[TRANSACTION] duplicate submission ignored | user: {}",
                    user.getId());

            return false;
        }

        Transaction transaction = new Transaction();

        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setCategory(category);
        transaction.setKind(category.getKind());
        transaction.setAmount(dto.amount());
        transaction.setDescription(dto.description());
        transaction.setOccurredAt(occurredAt);
        transaction.setPaymentMethod(dto.paymentMethod());
        transaction.setObservation(dto.observation());
        transaction.setRecurrent(dto.recurring());
        transaction.setIdempotencyKey(key);

        try {
            transactionRepository.saveAndFlush(transaction);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn("[TRANSACTION] duplicate race ignored | user: {}",
                    user.getId());

            return false;
        }

        log.info("[TRANSACTION] new transaction created | user: {} | transactionId: {} | kind {}",
                user.getId(),
                transaction.getId(),
                transaction.getKind()
        );

        return true;
    }

    public Page<?> listRecentTransactions(LocalDate start, LocalDate end){

        UUID userId = UserContext.getUserId();

        Page<Transaction> page = (start != null && end != null)
                ? transactionRepository.findLastTransactionsInPeriod(
                        userId, start, end, PageRequest.of(0, 10))
                : transactionRepository.findLastTransactions(
                        userId, PageRequest.of(0, 10));

        return page
                        .map(transaction -> new DashboardRecentTransactionResponseDTO(
                                transaction.getId(),
                                transaction.getAmount(),
                                transaction.getDescription(),
                                transaction.getKind(),
                                Formatters.formatRelativeDate(transaction.getOccurredAt())
                        ));
    }

    public Page<?> listTransactions(Pageable pageable) {

        UUID userId = UserContext.getUserId();

        Pageable safePageable = PageableUtils.limitPageSize(pageable);

        return transactionRepository.findLastTransactions(userId, safePageable)
                        .map(transaction -> {
                            String dataLabel = Formatters.formatRelativeDate(transaction.getOccurredAt());
                            Category category = transaction.getCategory();
                            return new ListTransactionResponseDTO(
                                    transaction.getId(),
                                    transaction.getAmount(),
                                    transaction.getDescription(),
                                    transaction.getObservation(),
                                    transaction.getKind(),
                                    transaction.getOccurredAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                                    category != null ? category.getName() : null,
                                    transaction.getPaymentMethod(),
                                    dataLabel,
                                    category != null ? category.getColor() : null
                            );
                        });
    }

    public TransactionDetailsResponseDTO getTransactionDetails(UUID transactionId) {
        UUID userId = UserContext.getUserId();

        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(TransactionNotFoundException::new);

        Category category = transaction.getCategory();

        return new TransactionDetailsResponseDTO(
                transaction.getId(),
                transaction.getDescription(),
                transaction.getObservation(),
                transaction.getAmount(),
                transaction.getKind(),
                category != null ? category.getId() : null,
                category != null ? category.getName() : null,
                transaction.getPaymentMethod(),
                transaction.getOccurredAt(),
                transaction.isRecurrent()
        );
    }

    @Transactional
    public void updateTransaction(UUID transactionID, UpdateTransactionDTO dto) {
        UUID userId = UserContext.getUserId();

        Transaction transaction = transactionRepository.findByIdAndUserId(transactionID, userId)
                .orElseThrow(TransactionNotFoundException::new);

        Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                .orElseThrow(CategoryNotFoundException::new);

        transaction.setCategory(category);
        transaction.setKind(category.getKind());
        transaction.setAmount(dto.amount());
        transaction.setDescription(dto.description());
        transaction.setOccurredAt(dto.occurredAt());
        transaction.setPaymentMethod(dto.paymentMethod());
        transaction.setObservation(dto.observation());
        transaction.setRecurrent(dto.recurring());
    }

    public void deleteTransaction(UUID transactionId) {
        UUID userId = UserContext.getUserId();

        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(TransactionNotFoundException::new);

        transactionRepository.delete(transaction);
    }
}
