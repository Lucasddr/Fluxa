package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional <Account> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT a.id FROM Account a WHERE a.user.id = :id")
    UUID findByUserId(@Param("id") UUID userId);

    @Query("SELECT a.name FROM Account a WHERE a.user.id = :id")
    String findAccountNameByUserId(@Param("id") UUID userId);

    @Query("SELECT a.currentBalance FROM Account a WHERE a.user.id = :id")
    BigDecimal findAccountCurrentBalanceByUserId(@Param("id") UUID userId);

    @Modifying
    @Query("UPDATE Account a SET a.currentBalance = :amount WHERE a.user.id = :id")
    void updateAccountBalance(@Param("amount") BigDecimal amount,
                              @Param("id") UUID userId);
}
