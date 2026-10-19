package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional <Account> findByIdAndUserId(UUID id, UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :accountId AND a.user.id = :userId")
    Optional<Account> lockByIdAndUserId(
            @Param("accountId") UUID accountId,
            @Param("userId") UUID userId);

    @Query("SELECT a FROM Account a WHERE a.user.id = :userId ORDER BY a.isDefault DESC, a.name ASC")
    List<Account> findAllForUser(@Param("userId") UUID userId);

    @Query("SELECT a FROM Account a WHERE a.user.id = :userId AND a.isDefault = true")
    Optional<Account> findDefaultForUser(@Param("userId") UUID userId);

    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);
}
