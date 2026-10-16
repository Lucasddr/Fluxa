package com.fluxa.backend.service;

import com.fluxa.backend.domain.enums.InstallmentStatus;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.update.UpdateInstallmentDTO;
import com.fluxa.backend.dto.response.CreditPurchaseDetailsResponseDTO;
import com.fluxa.backend.dto.response.InstallmentResponseDTO;
import com.fluxa.backend.exception.CreditPurchaseNotFoundException;
import com.fluxa.backend.exception.InstallmentAlreadyPaidException;
import com.fluxa.backend.exception.InvalidCategoryKindException;
import com.fluxa.backend.exception.InvalidInstallmentsSumException;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.CreditPurchaseRepository;
import com.fluxa.backend.repository.InstallmentRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CreditPurchaseServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private CreditPurchaseService creditPurchaseService;

    @Autowired
    private InstallmentService installmentService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CreditPurchaseRepository creditPurchaseRepository;

    @Autowired
    private InstallmentRepository installmentRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private UUID userId;
    private UUID expenseCategoryId;
    private UUID incomeCategoryId;

    @BeforeEach
    void setup() {
        String email = "credit" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Credit User", email, "Teste1234"));

        userId = userRepository.findByEmail(email).orElseThrow().getId();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, List.of()));

        var categories = categoryRepository.findCategoryByUserId(userId, PageRequest.of(0, 10));

        expenseCategoryId = categories.stream()
                .filter(c -> c.getKind().name().equals("EXPENSE"))
                .findFirst()
                .orElseThrow()
                .getId();

        incomeCategoryId = categories.stream()
                .filter(c -> c.getKind().name().equals("INCOME"))
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private CreateCreditPurchaseDTO equalDto() {
        return new CreateCreditPurchaseDTO(
                "Notebook",
                "Loja Teste",
                new BigDecimal("100.00"),
                LocalDate.now(),
                3,
                LocalDate.now().plusDays(1),
                expenseCategoryId,
                null,
                null);
    }

    @Test
    void createEqualModeSplitsAmountAndDates() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        CreditPurchaseDetailsResponseDTO details =
                creditPurchaseService.getCreditPurchaseDetails(purchaseId);

        assertEquals(3, details.installments().size());
        assertEquals(new BigDecimal("33.33"), details.installments().get(0).amount());
        assertEquals(new BigDecimal("33.33"), details.installments().get(1).amount());
        assertEquals(new BigDecimal("33.34"), details.installments().get(2).amount());
        assertEquals(3, details.pendingCount());
        assertEquals(0, details.paidCount());
    }

    @Test
    void createManualModeKeepsCustomValues() {
        var manual = List.of(
                new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                        new BigDecimal("60.00"), LocalDate.now().plusDays(5)),
                new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                        new BigDecimal("40.00"), LocalDate.now().plusDays(40)));

        var dto = new CreateCreditPurchaseDTO(
                "Celular", "Loja Teste", new BigDecimal("100.00"),
                LocalDate.now(), 2, LocalDate.now().plusDays(5),
                expenseCategoryId, null, manual);

        CreditPurchaseDetailsResponseDTO details =
                creditPurchaseService.getCreditPurchaseDetails(
                        creditPurchaseService.createCreditPurchase(dto));

        assertEquals(new BigDecimal("60.00"), details.installments().get(0).amount());
        assertEquals(new BigDecimal("40.00"), details.installments().get(1).amount());
    }

    @Test
    void createManualSumMismatchThrows() {
        var manual = List.of(
                new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                        new BigDecimal("60.00"), LocalDate.now().plusDays(5)),
                new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                        new BigDecimal("30.00"), LocalDate.now().plusDays(40)));

        var dto = new CreateCreditPurchaseDTO(
                "Celular", "Loja Teste", new BigDecimal("100.00"),
                LocalDate.now(), 2, LocalDate.now().plusDays(5),
                expenseCategoryId, null, manual);

        assertThrows(InvalidInstallmentsSumException.class,
                () -> creditPurchaseService.createCreditPurchase(dto));
    }

    @Test
    void createManualCountMismatchThrows() {
        var manual = List.of(
                new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                        new BigDecimal("100.00"), LocalDate.now().plusDays(5)));

        var dto = new CreateCreditPurchaseDTO(
                "Celular", "Loja Teste", new BigDecimal("100.00"),
                LocalDate.now(), 2, LocalDate.now().plusDays(5),
                expenseCategoryId, null, manual);

        assertThrows(InvalidInstallmentsSumException.class,
                () -> creditPurchaseService.createCreditPurchase(dto));
    }

    @Test
    void createWithIncomeCategoryThrows() {
        var dto = new CreateCreditPurchaseDTO(
                "Notebook", "Loja", new BigDecimal("100.00"),
                LocalDate.now(), 1, LocalDate.now().plusDays(1),
                incomeCategoryId, null, null);

        assertThrows(InvalidCategoryKindException.class,
                () -> creditPurchaseService.createCreditPurchase(dto));
    }

    @Test
    void payCreatesTransactionAndLeavesPayable() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        CreditPurchaseDetailsResponseDTO details =
                creditPurchaseService.getCreditPurchaseDetails(purchaseId);

        UUID installmentId = details.installments().get(0).id();

        UUID transactionId = installmentService.payInstallment(installmentId, null);

        var transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow();

        assertEquals(new BigDecimal("33.33"), transaction.getAmount());
        assertEquals(transaction.getInstallment().getId(), installmentId);

        InstallmentResponseDTO paid =
                installmentService.getInstallment(installmentId);
        assertEquals(InstallmentStatus.PAID, paid.status());

        BigDecimal payable = installmentRepository.getTotalPayableAccounts(
                userId, LocalDate.now().minusDays(1), LocalDate.now().plusMonths(6));
        assertEquals(new BigDecimal("66.67"), payable);
    }

    @Test
    void doublePayThrows() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(purchaseId).installments().get(0).id();

        installmentService.payInstallment(installmentId, null);

        assertThrows(InstallmentAlreadyPaidException.class,
                () -> installmentService.payInstallment(installmentId, null));
    }

    @Test
    void overdueIsRecordedOnRead() {
        var dto = new CreateCreditPurchaseDTO(
                "Antiga", "Loja", new BigDecimal("50.00"),
                LocalDate.now().minusDays(40), 1,
                LocalDate.now().minusDays(10),
                expenseCategoryId, null, null);

        UUID purchaseId = creditPurchaseService.createCreditPurchase(dto);

        CreditPurchaseDetailsResponseDTO details =
                creditPurchaseService.getCreditPurchaseDetails(purchaseId);

        assertEquals(InstallmentStatus.OVERDUE, details.installments().get(0).status());
    }

    @Test
    void deleteRemovesAllPartsTogether() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(purchaseId).installments().get(0).id();

        installmentService.payInstallment(installmentId, null);

        creditPurchaseService.deleteCreditPurchase(purchaseId);

        assertTrue(creditPurchaseRepository.findByIdAndUserId(purchaseId, userId).isEmpty());
        assertTrue(installmentRepository
                .findByCreditPurchase_IdAndCreditPurchase_UserIdOrderByNumberAsc(purchaseId, userId)
                .isEmpty());
        assertTrue(transactionRepository
                .findByUserIdAndInstallment_CreditPurchase_Id(userId, purchaseId)
                .isEmpty());
    }

    @Test
    void otherUserCannotSeePurchase() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        String otherEmail = "other" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Other User", otherEmail, "Teste1234"));
        UUID otherId = userRepository.findByEmail(otherEmail).orElseThrow().getId();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(otherId, null, List.of()));

        assertThrows(CreditPurchaseNotFoundException.class,
                () -> creditPurchaseService.getCreditPurchaseDetails(purchaseId));
    }

    @Test
    void updateSingleAmountRefreshesPurchaseTotal() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(purchaseId).installments().get(0).id();

        installmentService.updateInstallment(
                installmentId,
                new UpdateInstallmentDTO(new BigDecimal("40.00"), null),
                "ONE");

        CreditPurchaseDetailsResponseDTO details =
                creditPurchaseService.getCreditPurchaseDetails(purchaseId);

        assertEquals(new BigDecimal("106.67"), details.totalAmount());
    }

    @Test
    void emptyUpdateThrows() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(purchaseId).installments().get(0).id();

        assertThrows(Exception.class,
                () -> installmentService.updateInstallment(
                        installmentId,
                        new UpdateInstallmentDTO(null, null),
                        "ONE"));
    }

    @Test
    void manualEmptyListFallsBackToEqualMode() {
        var dto = new CreateCreditPurchaseDTO(
                "Livro", "Loja", new BigDecimal("90.00"),
                LocalDate.now(), 3, LocalDate.now().plusDays(1),
                expenseCategoryId, null, Collections.emptyList());

        CreditPurchaseDetailsResponseDTO details =
                creditPurchaseService.getCreditPurchaseDetails(
                        creditPurchaseService.createCreditPurchase(dto));

        assertEquals(3, details.installments().size());
        assertEquals(new BigDecimal("30.00"), details.installments().get(0).amount());
    }

    @Test
    void dashboardPayableUsesForwardHorizon() {
        var far = new CreateCreditPurchaseDTO(
                "Longe", "Loja", new BigDecimal("100.00"),
                LocalDate.now(), 2, LocalDate.now().plusDays(60),
                expenseCategoryId, null, null);

        creditPurchaseService.createCreditPurchase(far);

        var window = new com.fluxa.backend.dto.request.DashboardDTO(
                LocalDate.now().minusDays(29), LocalDate.now());

        assertEquals(new BigDecimal("0"),
                dashboardService.buildDashboardDTO(window).accountsPayable());

        var near = new CreateCreditPurchaseDTO(
                "Perto", "Loja", new BigDecimal("60.00"),
                LocalDate.now(), 2, LocalDate.now().minusDays(5),
                expenseCategoryId, null, null);

        UUID nearId = creditPurchaseService.createCreditPurchase(near);

        var inHorizon = dashboardService.buildDashboardDTO(window);

        assertEquals(new BigDecimal("60.00"), inHorizon.accountsPayable());

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(nearId).installments().get(0).id();

        installmentService.payInstallment(installmentId, null);

        var afterPay = dashboardService.buildDashboardDTO(window);

        assertEquals(new BigDecimal("30.00"), afterPay.accountsPayable());
        assertEquals(new BigDecimal("30.00"), afterPay.expenses());
    }

    @Test
    void oversizedIdempotencyKeyIsRejectedAsBadRequest() {
        UUID purchaseId = creditPurchaseService.createCreditPurchase(equalDto());

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(purchaseId).installments().get(0).id();

        assertThrows(com.fluxa.backend.exception.InvalidInstallmentOperationException.class,
                () -> installmentService.payInstallment(
                        installmentId, "1234567890-1234567890-1234567890-1234567890"));
    }

    @Test
    void postponingOverdueRestoresPending() {
        var dto = new CreateCreditPurchaseDTO(
                "Antiga", "Loja", new BigDecimal("50.00"),
                LocalDate.now().minusDays(40), 1,
                LocalDate.now().minusDays(10),
                expenseCategoryId, null, null);

        UUID purchaseId = creditPurchaseService.createCreditPurchase(dto);

        UUID installmentId = creditPurchaseService
                .getCreditPurchaseDetails(purchaseId).installments().get(0).id();

        assertEquals(InstallmentStatus.OVERDUE,
                installmentService.getInstallment(installmentId).status());

        installmentService.updateInstallment(
                installmentId,
                new UpdateInstallmentDTO(null, LocalDate.now().plusDays(5)),
                "ONE");

        assertEquals(InstallmentStatus.PENDING,
                installmentService.getInstallment(installmentId).status());
    }
}
