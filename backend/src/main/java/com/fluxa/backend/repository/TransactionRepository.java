package com.fluxa.backend.repository;


import com.fluxa.backend.domain.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>{

    @Query(
        value = """
        SELECT COALESCE(SUM(t.amount), 0) 
        FROM Transaction t 
        WHERE t.user.id = :userId
        AND t.kind = 'INCOME' 
        AND t.occurredAt BETWEEN :start AND :end
        """)
    BigDecimal getTotalIncome(
            @Param("userId") UUID userId,
            @Param("start")LocalDate start,
            @Param("end") LocalDate end
            );

        @Query(
            value = """
            SELECT COALESCE(SUM(t.amount), 0) 
            FROM Transaction t 
            WHERE t.user.id = :userId
            AND t.kind = 'EXPENSE' 
            AND t.occurredAt BETWEEN :start AND :end
            """)
        BigDecimal getTotalExpense(
                @Param("userId") UUID userId,
                @Param("start")LocalDate start,
                @Param("end") LocalDate end
                );

        Page<Transaction> findByUserId(
                UUID userId,
                Pageable pageable
        );

        @Query(
            value = """
            SELECT t
            FROM Transaction t
            WHERE t.user.id = :userId
            ORDER BY t.occurredAt DESC
        """)

        Page<Transaction> findLastTransactions(
                @Param("userId") UUID userId,
                Pageable pageable
        );
}
