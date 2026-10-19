package com.fluxa.backend.service;

import com.fluxa.backend.domain.enums.BalanceObservationStatus;
import com.fluxa.backend.domain.enums.BalanceResolution;
import com.fluxa.backend.domain.enums.BalanceTrustStatus;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.dto.request.create.CreateBalanceObservationDTO;
import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import com.fluxa.backend.dto.request.update.ResolveBalanceObservationDTO;
import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.DashboardDTO;
import com.fluxa.backend.exception.AccountInUseException;
import com.fluxa.backend.repository.CategoryRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AccountBalanceServiceTest {

    @Autowired private AuthService authService;
    @Autowired private AccountBalanceService accountBalanceService;
    @Autowired private AccountService accountService;
    @Autowired private TransactionService transactionService;
    @Autowired private CreditPurchaseService creditPurchaseService;
    @Autowired private DashboardService dashboardService;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private UserRepository userRepository;

    private UUID userId;
    private UUID accountId;
    private UUID expenseCategoryId;
    private UUID incomeCategoryId;

    @BeforeEach
    void setUp() {
        String email = "balance-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Balance User", email, "Teste1234"));
        userId = userRepository.findByEmail(email).orElseThrow().getId();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, List.of()));

        accountId = accountService.listAccounts().get(0).id();
        expenseCategoryId = categoryRepository
                .findCategoryByUserId(userId, PageRequest.of(0, 10))
                .stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst()
                .orElseThrow()
                .getId();
        incomeCategoryId = categoryRepository
                .findCategoryByUserId(userId, PageRequest.of(0, 10))
                .stream()
                .filter(category -> category.getKind() == CategoryKind.INCOME)
                .findFirst()
                .orElseThrow()
                .getId();
    }

    @Test
    void manualBalanceIsPersistedWithDateAndPendingDifference() {
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("1500.00"), LocalDate.now()));

        assertEquals(BalanceObservationStatus.PENDING_REVIEW, observation.status());
        assertEquals(new BigDecimal("1500.00"), observation.observedBalance());
        assertEquals(0, observation.ledgerBalance().compareTo(BigDecimal.ZERO));
        assertEquals(new BigDecimal("1500.00"), observation.difference());
        assertEquals(LocalDate.now(), observation.balanceAsOf());
        assertNotNull(observation.recordedAt());

        var summary = accountBalanceService.getAccountSummary(accountId);
        assertEquals(BalanceTrustStatus.PENDING_REVIEW, summary.status());
        assertEquals(0, summary.currentBalance().compareTo(BigDecimal.ZERO));
    }

    @Test
    void acceptingObservedBalanceAnchorsLaterRecordedTransactions() {
        LocalDate asOf = LocalDate.now().minusDays(1);
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("1500.00"), asOf));

        accountBalanceService.resolveObservation(
                accountId,
                observation.id(),
                new ResolveBalanceObservationDTO(BalanceResolution.USE_OBSERVED_BALANCE));

        transactionService.createTransaction(
                transaction(new BigDecimal("125.50"), "Compra após conferência", LocalDate.now()),
                null);

        var summary = accountBalanceService.getAccountSummary(accountId);
        assertEquals(BalanceTrustStatus.USER_ACCEPTED, summary.status());
        assertEquals(new BigDecimal("1374.50"), summary.currentBalance());
        assertEquals(new BigDecimal("-125.50"), summary.ledgerBalance());
    }

    @Test
    void choosingRegisteredTransactionsUsesTheLedgerAsOperationalBase() {
        transactionService.createTransaction(
                transaction(new BigDecimal("25.00"), "Compra registrada", LocalDate.now()),
                null);
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("500.00"), LocalDate.now()));

        accountBalanceService.resolveObservation(
                accountId,
                observation.id(),
                new ResolveBalanceObservationDTO(
                        BalanceResolution.USE_REGISTERED_TRANSACTIONS));

        var summary = accountBalanceService.getAccountSummary(accountId);
        assertEquals(BalanceTrustStatus.USER_ACCEPTED, summary.status());
        assertEquals(new BigDecimal("-25.00"), summary.currentBalance());
    }

    @Test
    void newBackdatedTransactionAfterBalanceCheckpointReturnsItToReview() {
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("500.00"), LocalDate.now()));
        accountBalanceService.resolveObservation(
                accountId,
                observation.id(),
                new ResolveBalanceObservationDTO(BalanceResolution.USE_OBSERVED_BALANCE));

        transactionService.createTransaction(
                transaction(new BigDecimal("25.00"), "Movimentação retroativa", LocalDate.now().minusDays(1)),
                null);

        var summary = accountBalanceService.getAccountSummary(accountId);
        assertEquals(BalanceTrustStatus.PENDING_REVIEW, summary.status());
        assertEquals(new BigDecimal("-25.00"), summary.currentBalance());
    }

    @Test
    void sameDayTransactionRecordedAfterBalanceCheckpointUpdatesCurrentBalance() {
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("500.00"), LocalDate.now()));
        accountBalanceService.resolveObservation(
                accountId,
                observation.id(),
                new ResolveBalanceObservationDTO(BalanceResolution.USE_OBSERVED_BALANCE));

        transactionService.createTransaction(
                transaction(new BigDecimal("25.00"), "Compra após informar saldo", LocalDate.now()),
                null);

        var summary = accountBalanceService.getAccountSummary(accountId);
        assertEquals(BalanceTrustStatus.USER_ACCEPTED, summary.status());
        assertEquals(new BigDecimal("475.00"), summary.currentBalance());
    }

    @Test
    void backdatedTransactionRefreshesPendingDifferenceFromRegisteredHistory() {
        LocalDate historyDate = LocalDate.now().minusDays(2);
        transactionService.createTransaction(
                transaction(new BigDecimal("100.00"), "Despesa histórica", historyDate), null);
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("700.00"), LocalDate.now().minusDays(1)));
        accountBalanceService.resolveObservation(
                accountId,
                observation.id(),
                new ResolveBalanceObservationDTO(BalanceResolution.USE_OBSERVED_BALANCE));

        transactionService.createTransaction(
                incomeTransaction(new BigDecimal("50.00"), "Receita histórica", historyDate), null);

        transactionService.createTransaction(
                transaction(new BigDecimal("10.00"), "Outra despesa histórica", historyDate), null);

        var updatedObservation = accountBalanceService.listObservations(accountId).get(0);
        assertEquals(BalanceObservationStatus.PENDING_REVIEW, updatedObservation.status());
        assertEquals(new BigDecimal("-60.00"), updatedObservation.ledgerBalance());
        assertEquals(new BigDecimal("760.00"), updatedObservation.difference());
    }

    @Test
    void accountWithBalanceObservationsCannotBeDeleted() {
        accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(BigDecimal.ZERO, LocalDate.now()));

        assertThrows(AccountInUseException.class,
                () -> accountService.deleteAccount(accountId));
    }

    @Test
    void forecastHorizonIsIndependentFromHistoricalPeriod() {
        creditPurchaseService.createCreditPurchase(new CreateCreditPurchaseDTO(
                "Compra parcelada", "Loja", new BigDecimal("100.00"), LocalDate.now(),
                2, LocalDate.now().plusDays(10), expenseCategoryId, null, null));
        LocalDate historicalDate = LocalDate.now().minusDays(90);

        var sevenDays = dashboardService.buildDashboardDTO(
                new DashboardDTO(historicalDate, historicalDate, 7));
        var thirtyDays = dashboardService.buildDashboardDTO(
                new DashboardDTO(historicalDate, historicalDate, 30));
        var ninetyDays = dashboardService.buildDashboardDTO(
                new DashboardDTO(historicalDate, historicalDate, 90));

        assertEquals(0, sevenDays.accountsPayable().compareTo(BigDecimal.ZERO));
        assertEquals(0, thirtyDays.accountsPayable().compareTo(new BigDecimal("50.00")));
        assertEquals(0, ninetyDays.accountsPayable().compareTo(new BigDecimal("100.00")));
    }

    @Test
    void availableBalanceUsesResolvedObservedAnchorAndForecastCommitments() {
        var observation = accountBalanceService.createManualObservation(
                accountId,
                new CreateBalanceObservationDTO(new BigDecimal("1000.00"), LocalDate.now().minusDays(1)));
        accountBalanceService.resolveObservation(
                accountId,
                observation.id(),
                new ResolveBalanceObservationDTO(BalanceResolution.USE_OBSERVED_BALANCE));

        creditPurchaseService.createCreditPurchase(new CreateCreditPurchaseDTO(
                "Compromisso", "Loja", new BigDecimal("200.00"), LocalDate.now(),
                1, LocalDate.now().plusDays(1), expenseCategoryId, null, null));

        var dashboard = dashboardService.buildDashboardDTO(new DashboardDTO(
                LocalDate.now().minusDays(60),
                LocalDate.now().minusDays(31),
                7));

        assertEquals(new BigDecimal("1000.00"), dashboard.currentBalance());
        assertEquals(new BigDecimal("200.00"), dashboard.accountsPayable());
        assertEquals(new BigDecimal("800.00"), dashboard.availableBalance());
        assertEquals(7, dashboard.forecastDays());
        assertEquals(BalanceTrustStatus.USER_ACCEPTED, dashboard.balanceStatus());
    }

    private CreateTransactionDTO transaction(BigDecimal amount, String description, LocalDate date) {
        return new CreateTransactionDTO(
                expenseCategoryId,
                amount,
                description,
                date,
                null,
                PaymentMethods.DEBIT,
                false,
                accountId);
    }

    private CreateTransactionDTO incomeTransaction(
            BigDecimal amount, String description, LocalDate date) {
        return new CreateTransactionDTO(
                incomeCategoryId,
                amount,
                description,
                date,
                null,
                PaymentMethods.PIX,
                false,
                accountId);
    }
}
