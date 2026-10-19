package com.fluxa.backend.dto.response;

public record StatementImportResultDTO(
        int importedCount,
        int duplicateCount,
        boolean statementBalanceRecorded,
        int categoryRulesSaved
) {
}
