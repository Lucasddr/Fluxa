package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional <Account> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT a.id FROM Account a WHERE a.user.id = :id")
    String findByUserId(@Param("id") UUID userId);

    @Query("SELECT a.name FROM Account a WHERE a.user.id = :id")
    String findAccountNameByUserId(@Param("id") UUID userId);
}
