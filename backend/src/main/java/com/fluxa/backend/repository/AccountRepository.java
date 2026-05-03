package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional <Account> findByIdAndUserId(UUID id, UUID userId);
}
