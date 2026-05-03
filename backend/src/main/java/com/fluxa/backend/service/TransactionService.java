package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.CreateTransactionDTO;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class TransactionService {

    public final AccountRepository accountRepository;
    public final CategoryRepository categoryRepository;
    public final TransactionRepository transactionRepository;
    public final UserRepository userRepository;


    public void createTransaction(CreateTransactionDTO dto){

        UUID userId = UserContext.getUserId();

        log.info("USER ID CONTEXT: {}", userId);

        Account account = accountRepository.findByIdAndUserId(dto.accountId(),userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transaction transaction = new Transaction();

        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setCategory(category);
        transaction.setKind(dto.kind());
        transaction.setAmount(dto.amount());
        transaction.setDescription(dto.description());
        transaction.setOccurredAt(
                LocalDate.from(dto.occurredAt().atStartOfDay())
        );

        transactionRepository.save(transaction);

        log.info("[TRANSACTION] new transaction created | user: {} | transactionId: {} | kind {}",
                user.getId(),
                transaction.getId(),
                transaction.getKind()
        );
    }
}
