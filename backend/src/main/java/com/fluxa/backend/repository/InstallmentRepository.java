package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Installment;
import com.fluxa.backend.domain.enums.InstallmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InstallmentRepository extends JpaRepository<Installment, UUID> {

    @Query("""
    SELECT COALESCE(SUM(i.amount), 0)
    FROM Installment i
    WHERE i.account.user.id = :userId
    AND i.status IN ('PENDING', 'OVERDUE')
    AND i.dueDate BETWEEN :start AND :end
    """)
    BigDecimal getTotalPayableAccounts(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("""
    SELECT COALESCE(SUM(i.amount), 0)
    FROM Installment i
    WHERE i.account.user.id = :userId
    AND i.status IN ('PENDING', 'OVERDUE')
    """)
    BigDecimal getTotalOpenPayable(@Param("userId") UUID userId);

    Optional<Installment> findByIdAndCreditPurchase_UserId(UUID id, UUID userId);

    List<Installment> findByCreditPurchase_IdAndCreditPurchase_UserIdOrderByNumberAsc(
            UUID creditPurchaseId, UUID userId);

    Page<Installment> findByCreditPurchase_UserIdAndStatus(
            UUID userId, InstallmentStatus status, Pageable pageable);

    Page<Installment> findByCreditPurchase_UserIdAndStatusAndDueDateBetween(
            UUID userId, InstallmentStatus status,
            LocalDate start, LocalDate end, Pageable pageable);

    Page<Installment> findByCreditPurchase_UserId(
            UUID userId, Pageable pageable);

    Page<Installment> findByCreditPurchase_UserIdAndDueDateBetween(
            UUID userId, LocalDate start, LocalDate end, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT i FROM Installment i
    JOIN FETCH i.creditPurchase
    WHERE i.id = :id
    AND i.creditPurchase.user.id = :userId
    """)
    Optional<Installment> lockByIdAndUserId(
            @Param("id") UUID id, @Param("userId") UUID userId);

    @Modifying
    @Query("""
    UPDATE Installment i
    SET i.status = 'OVERDUE'
    WHERE i.creditPurchase.user.id = :userId
    AND i.status = 'PENDING'
    AND i.dueDate < :today
    """)
    int markOverdue(@Param("userId") UUID userId, @Param("today") LocalDate today);

    boolean existsByCreditPurchase_IdAndCreditPurchase_UserIdAndStatus(
            UUID creditPurchaseId, UUID userId, InstallmentStatus status);

    long countByCreditPurchase_IdAndCreditPurchase_UserIdAndStatus(
            UUID creditPurchaseId, UUID userId, InstallmentStatus status);

    @Query("""
    SELECT i.creditPurchase.id, i.status, COUNT(i)
    FROM Installment i
    WHERE i.creditPurchase.user.id = :userId
    GROUP BY i.creditPurchase.id, i.status
    """)
    List<Object[]> countByPurchaseAndStatus(@Param("userId") UUID userId);
}
