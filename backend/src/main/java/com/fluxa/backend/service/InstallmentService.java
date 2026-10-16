package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.CreditPurchase;
import com.fluxa.backend.domain.entity.Installment;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.InstallmentStatus;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.update.UpdateInstallmentDTO;
import com.fluxa.backend.dto.response.InstallmentResponseDTO;
import com.fluxa.backend.exception.CreditPurchaseNotFoundException;
import com.fluxa.backend.exception.InstallmentAlreadyPaidException;
import com.fluxa.backend.exception.InstallmentNotFoundException;
import com.fluxa.backend.exception.InvalidInstallmentOperationException;
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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class InstallmentService {

    public final CreditPurchaseRepository creditPurchaseRepository;
    public final InstallmentRepository installmentRepository;
    public final TransactionRepository transactionRepository;
    public final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public Page<InstallmentResponseDTO> listInstallments(
            InstallmentStatus status, LocalDate start, LocalDate end, Pageable pageable) {

        UUID userId = UserContext.getUserId();
        Pageable safePageable = PageableUtils.limitPageSize(pageable);

        refreshOverdue(userId);

        Page<Installment> page;

        if (status != null && start != null && end != null) {
            page = installmentRepository.findByCreditPurchase_UserIdAndStatusAndDueDateBetween(
                    userId, status, start, end, safePageable);
        } else if (status != null) {
            page = installmentRepository.findByCreditPurchase_UserIdAndStatus(
                    userId, status, safePageable);
        } else if (start != null && end != null) {
            page = installmentRepository.findByCreditPurchase_UserIdAndDueDateBetween(
                    userId, start, end, safePageable);
        } else {
            page = installmentRepository.findByCreditPurchase_UserId(userId, safePageable);
        }

        return page.map(this::toDTO);
    }

    @Transactional
    public InstallmentResponseDTO getInstallment(UUID installmentId) {

        UUID userId = UserContext.getUserId();

        refreshOverdue(userId);

        Installment installment = installmentRepository
                .findByIdAndCreditPurchase_UserId(installmentId, userId)
                .orElseThrow(InstallmentNotFoundException::new);

        return toDTO(installment);
    }

    @Transactional
    public UUID payInstallment(UUID installmentId, String idempotencyKey) {

        UUID userId = UserContext.getUserId();

        refreshOverdue(userId);

        Installment installment = installmentRepository
                .lockByIdAndUserId(installmentId, userId)
                .orElseThrow(InstallmentNotFoundException::new);

        if (installment.getStatus() == InstallmentStatus.PAID) {
            throw new InstallmentAlreadyPaidException();
        }

        String key = idempotencyKey != null && !idempotencyKey.isBlank()
                ? idempotencyKey
                : null;

        if (key != null && transactionRepository
                .findByUserIdAndIdempotencyKey(userId, key)
                .isPresent()) {
            log.warn("[INSTALLMENT] duplicate idempotency key ignored | user: {} | installmentId: {}",
                    userId, installmentId);

            throw new InstallmentAlreadyPaidException();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CreditPurchase purchase = installment.getCreditPurchase();

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAccount(installment.getAccount());
        transaction.setCategory(purchase.getCategory());
        transaction.setKind(purchase.getCategory().getKind());
        transaction.setAmount(installment.getAmount());
        transaction.setDescription(
                purchase.getTitle() + " - parcela "
                        + installment.getNumber() + "/"
                        + purchase.getInstallmentsQty());
        transaction.setOccurredAt(LocalDate.now());
        transaction.setPaymentMethod(PaymentMethods.CREDIT);
        transaction.setObservation(purchase.getNotes());
        transaction.setRecurrent(false);
        transaction.setInstallment(installment);
        transaction.setIdempotencyKey(key);

        transactionRepository.saveAndFlush(transaction);

        installment.setStatus(InstallmentStatus.PAID);

        log.info("[INSTALLMENT] installment paid | user: {} | installmentId: {} | transactionId: {}",
                userId, installmentId, transaction.getId());

        return transaction.getId();
    }

    @Transactional
    public void updateInstallment(UUID installmentId, UpdateInstallmentDTO dto, String scope) {

        UUID userId = UserContext.getUserId();

        refreshOverdue(userId);

        Installment installment = installmentRepository
                .findByIdAndCreditPurchase_UserId(installmentId, userId)
                .orElseThrow(InstallmentNotFoundException::new);

        if (installment.getStatus() == InstallmentStatus.PAID) {
            throw new InstallmentAlreadyPaidException();
        }

        if (dto.amount() == null && dto.dueDate() == null) {
            throw new InvalidInstallmentOperationException("Nada para atualizar: informe valor e/ou vencimento");
        }

        boolean following = "FOLLOWING".equalsIgnoreCase(scope);

        if (following) {
            shiftFollowingDueDates(installment, userId, dto);
            return;
        }

        if (dto.amount() != null) {
            installment.setAmount(dto.amount());
            refreshPurchaseTotal(installment.getCreditPurchase().getId(), userId);
        }

        if (dto.dueDate() != null) {
            installment.setDueDate(dto.dueDate());
            restorePendingIfPostponed(installment);
        }
    }

    private void shiftFollowingDueDates(
            Installment installment, UUID userId, UpdateInstallmentDTO dto) {

        if (dto.amount() != null) {
            throw new InvalidInstallmentOperationException(
                    "Escopo FOLLOWING aceita apenas mudança de vencimento");
        }

        if (dto.dueDate() == null) {
            throw new InvalidInstallmentOperationException(
                    "Escopo FOLLOWING exige o novo vencimento");
        }

        long shiftDays = ChronoUnit.DAYS.between(installment.getDueDate(), dto.dueDate());

        List<Installment> following = installmentRepository
                .findByCreditPurchase_IdAndCreditPurchase_UserIdOrderByNumberAsc(
                        installment.getCreditPurchase().getId(), userId)
                .stream()
                .filter(i -> i.getNumber() >= installment.getNumber())
                .filter(i -> i.getStatus() != InstallmentStatus.PAID)
                .toList();

        following.forEach(i -> {
            i.setDueDate(i.getDueDate().plusDays(shiftDays));
            restorePendingIfPostponed(i);
        });

        log.info("[INSTALLMENT] due dates shifted | user: {} | purchaseId: {} | fromNumber: {} | shiftDays: {}",
                userId, installment.getCreditPurchase().getId(),
                installment.getNumber(), shiftDays);
    }

    private void restorePendingIfPostponed(Installment installment) {
        if (installment.getStatus() == InstallmentStatus.OVERDUE
                && !installment.getDueDate().isBefore(LocalDate.now())) {
            installment.setStatus(InstallmentStatus.PENDING);
        }
    }

    private void refreshPurchaseTotal(UUID purchaseId, UUID userId) {

        CreditPurchase purchase = creditPurchaseRepository.findByIdAndUserId(purchaseId, userId)
                .orElseThrow(CreditPurchaseNotFoundException::new);

        BigDecimal total = installmentRepository
                .findByCreditPurchase_IdAndCreditPurchase_UserIdOrderByNumberAsc(purchaseId, userId)
                .stream()
                .map(Installment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        purchase.setTotalAmount(total);
    }

    private void refreshOverdue(UUID userId) {
        installmentRepository.markOverdue(userId, LocalDate.now());
        entityManager.flush();
        entityManager.clear();
    }

    private InstallmentResponseDTO toDTO(Installment installment) {
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
