package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.AccountBalanceObservation;
import com.fluxa.backend.domain.enums.BalanceObservationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountBalanceObservationRepository
        extends JpaRepository<AccountBalanceObservation, UUID> {

    @Query("""
        SELECT o FROM AccountBalanceObservation o
        WHERE o.account.id = :accountId AND o.user.id = :userId
        ORDER BY o.balanceAsOf DESC, o.recordedAt DESC
    """)
    List<AccountBalanceObservation> findAllForAccount(
            @Param("accountId") UUID accountId,
            @Param("userId") UUID userId);

    @Query("""
        SELECT o FROM AccountBalanceObservation o
        WHERE o.account.id = :accountId
          AND o.user.id = :userId
          AND o.status <> :pendingStatus
        ORDER BY o.balanceAsOf DESC, o.recordedAt DESC
    """)
    List<AccountBalanceObservation> findResolvedForAccount(
            @Param("accountId") UUID accountId,
            @Param("userId") UUID userId,
            @Param("pendingStatus") BalanceObservationStatus pendingStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT o FROM AccountBalanceObservation o
        WHERE o.id = :observationId
          AND o.account.id = :accountId
          AND o.user.id = :userId
    """)
    Optional<AccountBalanceObservation> lockByIdAndAccountAndUser(
            @Param("observationId") UUID observationId,
            @Param("accountId") UUID accountId,
            @Param("userId") UUID userId);

    boolean existsByAccountIdAndUserId(UUID accountId, UUID userId);

    @Query("""
        SELECT o FROM AccountBalanceObservation o
        WHERE o.account.id = :accountId
          AND o.user.id = :userId
           AND (
               o.balanceAsOf > :affectedDate
               OR (o.balanceAsOf = :affectedDate AND :transactionCreatedAt <= o.recordedAt)
           )
    """)
    List<AccountBalanceObservation> findAffectedObservations(
            @Param("accountId") UUID accountId,
            @Param("userId") UUID userId,
            @Param("affectedDate") LocalDate affectedDate,
            @Param("transactionCreatedAt") java.time.OffsetDateTime transactionCreatedAt);
}
