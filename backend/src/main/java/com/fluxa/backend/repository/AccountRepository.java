package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional <Account> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT a FROM Account a WHERE a.user.id = :userId ORDER BY a.isDefault DESC, a.name ASC")
    List<Account> findAllForUser(@Param("userId") UUID userId);

    @Query("SELECT a FROM Account a WHERE a.user.id = :userId AND a.isDefault = true")
    Optional<Account> findDefaultForUser(@Param("userId") UUID userId);

    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);
}
