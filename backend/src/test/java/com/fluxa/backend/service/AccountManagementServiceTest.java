package com.fluxa.backend.service;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import com.fluxa.backend.dto.request.create.CreateAccountDTO;
import com.fluxa.backend.dto.request.update.UpdateAccountDTO;
import com.fluxa.backend.exception.AccountInUseException;
import com.fluxa.backend.exception.AccountNotFoundException;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.CreditPurchaseRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AccountManagementServiceTest {

    @Autowired private AuthService authService;
    @Autowired private AccountService accountService;
    @Autowired private TransactionService transactionService;
    @Autowired private CreditPurchaseService creditPurchaseService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private CreditPurchaseRepository creditPurchaseRepository;
    @Autowired private UserRepository userRepository;

    private UUID userId;
    private UUID expenseCategoryId;

    @BeforeEach
    void setUp() {
        String email = "accounts-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Account User", email, "Teste1234"));
        userId = userRepository.findByEmail(email).orElseThrow().getId();

        authenticate(userId);
        expenseCategoryId = categoryRepository
                .findCategoryByUserId(userId, PageRequest.of(0, 10))
                .stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst()
                .orElseThrow()
                .getId();
    }

    @Test
    void registrationCreatesOneDefaultAccountAndAdditionalAccountsAreNotDefault() {
        var initial = accountService.listAccounts();
        assertEquals(1, initial.size());
        assertTrue(initial.get(0).isDefault());

        var created = accountService.createCustomAccount(new CreateAccountDTO("Poupança"));
        var accounts = accountService.listAccounts();

        assertEquals(2, accounts.size());
        assertEquals(initial.get(0).id(), accounts.get(0).id());
        assertTrue(accounts.get(0).isDefault());
        assertEquals("Poupança", created.name());
        assertFalse(created.isDefault());
    }

    @Test
    void selectingAnotherDefaultMovesTheDefaultFlag() {
        var original = accountService.listAccounts().get(0);
        var second = accountService.createCustomAccount(new CreateAccountDTO("Reserva"));

        accountService.setDefaultAccount(second.id());

        var accounts = accountService.listAccounts();
        assertEquals(second.id(), accounts.get(0).id());
        assertTrue(accounts.get(0).isDefault());
        assertFalse(accountRepository.findByIdAndUserId(original.id(), userId)
                .orElseThrow().isDefault());
    }

    @Test
    void namesAreUniqueIgnoringCase() {
        accountService.createCustomAccount(new CreateAccountDTO("Reserva"));

        assertThrows(AccountInUseException.class,
                () -> accountService.createCustomAccount(new CreateAccountDTO("reserva")));
    }

    @Test
    void legacyTransactionPayloadUsesDefaultAndExplicitAccountIsRespected() {
        var defaultAccount = accountService.listAccounts().get(0);
        var second = accountService.createCustomAccount(new CreateAccountDTO("Poupança"));

        transactionService.createTransaction(transactionDto(null, "Compra padrão"), null);
        transactionService.createTransaction(transactionDto(second.id(), "Compra poupança"), null);

        var transactions = transactionRepository.findAll().stream()
                .filter(transaction -> transaction.getUser().getId().equals(userId))
                .toList();

        assertEquals(defaultAccount.id(), transactions.stream()
                .filter(transaction -> transaction.getDescription().equals("Compra padrão"))
                .findFirst().orElseThrow().getAccount().getId());
        assertEquals(second.id(), transactions.stream()
                .filter(transaction -> transaction.getDescription().equals("Compra poupança"))
                .findFirst().orElseThrow().getAccount().getId());
    }

    @Test
    void creditPurchaseCanSelectTheBankAccount() {
        var selected = accountService.createCustomAccount(new CreateAccountDTO("Poupança"));
        var dto = new CreateCreditPurchaseDTO(
                "Compra", "Loja", new BigDecimal("120.00"), LocalDate.now(), 2,
                LocalDate.now().plusDays(30), expenseCategoryId, null, null,
                selected.id());

        UUID purchaseId = creditPurchaseService.createCreditPurchase(dto);

        assertEquals(selected.id(), creditPurchaseRepository
                .findByIdAndUserId(purchaseId, userId).orElseThrow().getAccount().getId());
    }

    @Test
    void accountWithTransactionsCannotBeDeleted() {
        var selected = accountService.createCustomAccount(new CreateAccountDTO("Poupança"));
        transactionService.createTransaction(transactionDto(selected.id(), "Compra"), null);

        assertThrows(AccountInUseException.class,
                () -> accountService.deleteAccount(selected.id()));
    }

    @Test
    void accountWithCreditPurchaseCannotBeDeleted() {
        var selected = accountService.createCustomAccount(new CreateAccountDTO("Poupança"));
        var purchase = new CreateCreditPurchaseDTO(
                "Compra", "Loja", new BigDecimal("120.00"), LocalDate.now(), 2,
                LocalDate.now().plusDays(30), expenseCategoryId, null, null,
                selected.id());
        creditPurchaseService.createCreditPurchase(purchase);

        assertThrows(AccountInUseException.class,
                () -> accountService.deleteAccount(selected.id()));
    }

    @Test
    void deletingDefaultAccountPromotesAnotherAccount() {
        var initialDefault = accountService.listAccounts().get(0);
        var replacement = accountService.createCustomAccount(new CreateAccountDTO("Reserva"));

        accountService.deleteAccount(initialDefault.id());

        var remaining = accountService.listAccounts();
        assertEquals(1, remaining.size());
        assertEquals(replacement.id(), remaining.get(0).id());
        assertTrue(remaining.get(0).isDefault());
    }

    @Test
    void lastAccountCannotBeDeleted() {
        UUID onlyAccountId = accountService.listAccounts().get(0).id();

        assertThrows(AccountInUseException.class,
                () -> accountService.deleteAccount(onlyAccountId));
    }

    @Test
    void anotherUserCannotRenameAnAccount() {
        UUID accountId = accountService.listAccounts().get(0).id();
        String otherEmail = "other-accounts-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Other User", otherEmail, "Teste1234"));
        UUID otherUserId = userRepository.findByEmail(otherEmail).orElseThrow().getId();
        authenticate(otherUserId);

        assertThrows(AccountNotFoundException.class,
                () -> accountService.updateAccount(accountId, new UpdateAccountDTO("Invadida")));
    }

    @Test
    void anotherUserCannotCreateTransactionInAnOwnedAccount() {
        UUID accountId = accountService.listAccounts().get(0).id();
        String otherEmail = "other-transaction-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Other User", otherEmail, "Teste1234"));
        UUID otherUserId = userRepository.findByEmail(otherEmail).orElseThrow().getId();
        authenticate(otherUserId);

        assertThrows(AccountNotFoundException.class,
                () -> transactionService.createTransaction(
                        transactionDto(accountId, "Conta de outra pessoa"), null));
    }

    private CreateTransactionDTO transactionDto(UUID accountId, String description) {
        return new CreateTransactionDTO(
                expenseCategoryId,
                new BigDecimal("12.50"),
                description,
                LocalDate.now(),
                null,
                PaymentMethods.DEBIT,
                false,
                accountId);
    }

    private static void authenticate(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(id, null, List.of()));
    }
}
