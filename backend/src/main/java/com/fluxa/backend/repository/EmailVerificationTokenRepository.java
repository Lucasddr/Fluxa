package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository
        extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.used = true WHERE t.user.id = :userId")
    int invalidateAllForUser(@Param("userId") UUID userId);
}
