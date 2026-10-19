package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.StatementImportCategoryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StatementImportCategoryRuleRepository
        extends JpaRepository<StatementImportCategoryRule, UUID> {
    @Query("""
        SELECT rule FROM StatementImportCategoryRule rule
        JOIN FETCH rule.category
        WHERE rule.account.id = :accountId AND rule.user.id = :userId
    """)
    List<StatementImportCategoryRule> findAllForAccount(
            @Param("accountId") UUID accountId,
            @Param("userId") UUID userId);

    Optional<StatementImportCategoryRule> findByAccountIdAndNormalizedDescription(
            UUID accountId, String normalizedDescription);
}
