package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.CreditPurchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditPurchaseRepository extends JpaRepository<CreditPurchase, UUID> {

    Optional<CreditPurchase> findByIdAndUserId(UUID id, UUID userId);

    Page<CreditPurchase> findByUserIdOrderByPurchaseDateDesc(UUID userId, Pageable pageable);
}
