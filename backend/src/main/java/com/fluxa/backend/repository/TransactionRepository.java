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
import java.util.List;
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

        @Query(value = """
        SELECT c.name AS category,
        SUM(t.amount) AS total_spent
        FROM transactions t
        JOIN categories c 
            ON c.id = t.category_id
        WHERE t.user_id = :userId
        AND t.kind = 'EXPENSE'
        GROUP BY c.name
        ORDER BY total_spent DESC
        LIMIT 1
        """, nativeQuery = true)
        List<Object[]> findBiggestExpense(UUID userId);

    @Query("""
        SELECT SUM(t.amount)
        FROM Transaction t
        WHERE t.user.id = :userId
        AND t.kind = 'EXPENSE'
        """)
    BigDecimal sumAllExpenses(
            @Param("userId") UUID userId);

    @Query("""
        SELECT SUM(t.amount)
        FROM Transaction t
        WHERE t.user.id = :userId
        AND t.kind = 'INCOME'
    """)
    BigDecimal sumAllIncomes(
            @Param("userId") UUID userID);
}
