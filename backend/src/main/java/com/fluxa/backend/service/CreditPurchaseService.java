package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.CreditPurchase;
import com.fluxa.backend.domain.entity.Installment;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.InstallmentStatus;
import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.update.UpdateCreditPurchaseDTO;
import com.fluxa.backend.dto.response.CreditPurchaseDetailsResponseDTO;
import com.fluxa.backend.dto.response.CreditPurchaseResponseDTO;
import com.fluxa.backend.dto.response.InstallmentResponseDTO;
import com.fluxa.backend.exception.AccountNotFoundException;
import com.fluxa.backend.exception.CategoryInactiveException;
import com.fluxa.backend.exception.CategoryNotFoundException;
import com.fluxa.backend.exception.CreditPurchaseNotFoundException;
import com.fluxa.backend.exception.InvalidCategoryKindException;
import com.fluxa.backend.exception.InvalidInstallmentsSumException;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.CreditPurchaseRepository;
import com.fluxa.backend.repository.InstallmentRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import com.fluxa.backend.util.PageableUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class CreditPurchaseService {

    public final AccountRepository accountRepository;
    public final CategoryRepository categoryRepository;
    public final CreditPurchaseRepository creditPurchaseRepository;
    public final InstallmentRepository installmentRepository;
    public final TransactionRepository transactionRepository;
    public final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public UUID createCreditPurchase(CreateCreditPurchaseDTO dto) {

        UUID userId = UserContext.getUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UUID accountId = accountRepository.findByUserId(userId);

        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);

        Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                .orElseThrow(CategoryNotFoundException::new);

        validateCategoryForPurchase(category);

        List<CreateCreditPurchaseDTO.ManualInstallmentDTO> manual = dto.installments();

        if (manual != null && !manual.isEmpty() && manual.size() != dto.installmentsQty()) {
            throw new InvalidInstallmentsSumException();
        }

        if (manual != null && !manual.isEmpty()) {
            BigDecimal sum = manual.stream()
                    .map(CreateCreditPurchaseDTO.ManualInstallmentDTO::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (sum.compareTo(dto.totalAmount()) != 0) {
                throw new InvalidInstallmentsSumException();
            }
        }

        CreditPurchase purchase = new CreditPurchase();
        purchase.setUser(user);
        purchase.setAccount(account);
        purchase.setCategory(category);
        purchase.setTitle(dto.title().trim());
        purchase.setMerchant(dto.merchant() != null ? dto.merchant().trim() : null);
        purchase.setTotalAmount(dto.totalAmount());
        purchase.setPurchaseDate(dto.purchaseDate());
        purchase.setInstallmentsQty(dto.installmentsQty());
        purchase.setFirstDueDate(dto.firstDueDate());
        purchase.setNotes(dto.notes());

        creditPurchaseRepository.save(purchase);

        List<Installment> installments = manual != null && !manual.isEmpty()
                ? buildManualInstallments(purchase, account, manual)
                : buildEqualInstallments(purchase, account, dto);

        installmentRepository.saveAll(installments);

        log.info("[CREDIT-PURCHASE] new purchase created | user: {} | purchaseId: {} | qty: {}",
                userId, purchase.getId(), dto.installmentsQty());

        return purchase.getId();
    }

    private List<Installment> buildEqualInstallments(
            CreditPurchase purchase, Account account, CreateCreditPurchaseDTO dto) {

        int qty = dto.installmentsQty();
        BigDecimal base = dto.totalAmount()
                .divide(BigDecimal.valueOf(qty), 2, RoundingMode.DOWN);

        List<Installment> installments = new ArrayList<>(qty);

        for (int i = 1; i <= qty; i++) {
            Installment installment = new Installment();
            installment.setCreditPurchase(purchase);
            installment.setAccount(account);
            installment.setNumber(i);
            installment.setDueDate(dto.firstDueDate().plusMonths(i - 1));

            if (i < qty) {
                installment.setAmount(base);
            } else {
                installment.setAmount(dto.totalAmount()
                        .subtract(base.multiply(BigDecimal.valueOf(qty - 1))));
            }

            installments.add(installment);
        }

        return installments;
    }

    private List<Installment> buildManualInstallments(
            CreditPurchase purchase,
            Account account,
            List<CreateCreditPurchaseDTO.ManualInstallmentDTO> manual) {

        List<Installment> installments = new ArrayList<>(manual.size());

        for (int i = 0; i < manual.size(); i++) {
            CreateCreditPurchaseDTO.ManualInstallmentDTO input = manual.get(i);

            Installment installment = new Installment();
            installment.setCreditPurchase(purchase);
            installment.setAccount(account);
            installment.setNumber(i + 1);
            installment.setAmount(input.amount());
            installment.setDueDate(input.dueDate());

            installments.add(installment);
        }

        return installments;
    }

    private void validateCategoryForPurchase(Category category) {
        if (category.getKind() != CategoryKind.EXPENSE) {
            throw new InvalidCategoryKindException();
        }

        if (!category.isActive()) {
            throw new CategoryInactiveException();
        }
    }

    @Transactional
    public Page<CreditPurchaseResponseDTO> listCreditPurchases(Pageable pageable) {

        UUID userId = UserContext.getUserId();
        Pageable safePageable = PageableUtils.limitPageSize(pageable);

        refreshOverdue(userId);

        Map<UUID, Map<InstallmentStatus, Long>> counts = countByPurchase(userId);

        return creditPurchaseRepository.findByUserIdOrderByPurchaseDateDesc(userId, safePageable)
                .map(purchase -> toListDTO(purchase, counts));
    }

    @Transactional
    public CreditPurchaseDetailsResponseDTO getCreditPurchaseDetails(UUID purchaseId) {

        UUID userId = UserContext.getUserId();

        refreshOverdue(userId);

        CreditPurchase purchase = creditPurchaseRepository.findByIdAndUserId(purchaseId, userId)
                .orElseThrow(CreditPurchaseNotFoundException::new);

        List<Installment> installments = installmentRepository
                .findByCreditPurchase_IdAndCreditPurchase_UserIdOrderByNumberAsc(purchaseId, userId);

        long paid = installments.stream()
                .filter(i -> i.getStatus() == InstallmentStatus.PAID)
                .count();

        long generatedTransactions = transactionRepository
                .findByUserIdAndInstallment_CreditPurchase_Id(userId, purchaseId)
                .size();

        return new CreditPurchaseDetailsResponseDTO(
                purchase.getId(),
                purchase.getTitle(),
                purchase.getMerchant(),
                purchase.getTotalAmount(),
                purchase.getPurchaseDate(),
                purchase.getInstallmentsQty(),
                purchase.getFirstDueDate(),
                purchase.getCategory().getId(),
                purchase.getCategory().getName(),
                purchase.getNotes(),
                installments.size() - paid,
                paid,
                generatedTransactions,
                installments.stream().map(this::toInstallmentDTO).toList()
        );
    }

    @Transactional
    public void updateCreditPurchase(UUID purchaseId, UpdateCreditPurchaseDTO dto) {

        UUID userId = UserContext.getUserId();

        CreditPurchase purchase = creditPurchaseRepository.findByIdAndUserId(purchaseId, userId)
                .orElseThrow(CreditPurchaseNotFoundException::new);

        if (dto.title() != null && !dto.title().isBlank()) {
            purchase.setTitle(dto.title().trim());
        }

        if (dto.merchant() != null) {
            purchase.setMerchant(dto.merchant().trim());
        }

        if (dto.notes() != null) {
            purchase.setNotes(dto.notes());
        }

        if (dto.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                    .orElseThrow(CategoryNotFoundException::new);

            validateCategoryForPurchase(category);
            purchase.setCategory(category);

            List<Transaction> generated = transactionRepository
                    .findByUserIdAndInstallment_CreditPurchase_Id(userId, purchaseId);
            generated.forEach(tx -> tx.setCategory(category));
        }
    }

    @Transactional
    public void deleteCreditPurchase(UUID purchaseId) {

        UUID userId = UserContext.getUserId();

        CreditPurchase purchase = creditPurchaseRepository.findByIdAndUserId(purchaseId, userId)
                .orElseThrow(CreditPurchaseNotFoundException::new);

        List<Transaction> generated = transactionRepository
                .findByUserIdAndInstallment_CreditPurchase_Id(userId, purchaseId);

        List<Installment> installments = installmentRepository
                .findByCreditPurchase_IdAndCreditPurchase_UserIdOrderByNumberAsc(purchaseId, userId);

        transactionRepository.deleteAll(generated);
        installmentRepository.deleteAll(installments);
        creditPurchaseRepository.delete(purchase);

        log.warn("[CREDIT-PURCHASE] purchase deleted with all parts | user: {} | purchaseId: {} | installments: {} | transactions: {}",
                userId, purchaseId, installments.size(), generated.size());
    }

    public void refreshOverdue() {
        refreshOverdue(UserContext.getUserId());
    }

    private void refreshOverdue(UUID userId) {
        installmentRepository.markOverdue(userId, LocalDate.now());
        entityManager.flush();
        entityManager.clear();
    }

    private Map<UUID, Map<InstallmentStatus, Long>> countByPurchase(UUID userId) {

        Map<UUID, Map<InstallmentStatus, Long>> counts = new HashMap<>();

        for (Object[] row : installmentRepository.countByPurchaseAndStatus(userId)) {
            UUID purchaseId = (UUID) row[0];
            InstallmentStatus status = (InstallmentStatus) row[1];
            long count = (long) row[2];

            counts.computeIfAbsent(purchaseId, ignored -> new EnumMap<>(InstallmentStatus.class))
                    .put(status, count);
        }

        return counts;
    }

    private CreditPurchaseResponseDTO toListDTO(
            CreditPurchase purchase, Map<UUID, Map<InstallmentStatus, Long>> counts) {

        Map<InstallmentStatus, Long> byStatus =
                counts.getOrDefault(purchase.getId(), Map.of());

        long paid = byStatus.getOrDefault(InstallmentStatus.PAID, 0L);

        return new CreditPurchaseResponseDTO(
                purchase.getId(),
                purchase.getTitle(),
                purchase.getMerchant(),
                purchase.getTotalAmount(),
                purchase.getPurchaseDate(),
                purchase.getInstallmentsQty(),
                purchase.getFirstDueDate(),
                purchase.getCategory().getId(),
                purchase.getCategory().getName(),
                purchase.getInstallmentsQty() - paid,
                paid
        );
    }

    private InstallmentResponseDTO toInstallmentDTO(Installment installment) {
        return new InstallmentResponseDTO(
                installment.getId(),
                installment.getCreditPurchase().getId(),
                installment.getCreditPurchase().getTitle(),
                installment.getNumber(),
                installment.getCreditPurchase().getInstallmentsQty(),
                installment.getDueDate(),
                installment.getAmount(),
                installment.getStatus()
        );
    }
}
