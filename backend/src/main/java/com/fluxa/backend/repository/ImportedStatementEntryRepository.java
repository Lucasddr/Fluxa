package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.ImportedStatementEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ImportedStatementEntryRepository extends JpaRepository<ImportedStatementEntry, UUID> {
    @Query("""
        SELECT entry.sourceReference FROM ImportedStatementEntry entry
        WHERE entry.account.id = :accountId
          AND entry.sourceReference IN :sourceReferences
    """)
    List<String> findExistingSourceReferences(
            @Param("accountId") UUID accountId,
            @Param("sourceReferences") Collection<String> sourceReferences);
}
