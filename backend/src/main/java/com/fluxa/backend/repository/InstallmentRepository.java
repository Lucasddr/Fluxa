package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Installment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface InstallmentRepository extends JpaRepository<Installment, UUID> {

    @Query("""
    SELECT COALESCE(SUM(i.amount), 0)
    FROM Installment i
    WHERE i.account.user.id = :userId
    AND i.dueDate BETWEEN :start AND :end
    """)
    BigDecimal getTotalPayableAccounts(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}
