package com.fluxa.backend.service;

import java.text.Normalizer;
import java.util.Locale;

final class StatementImportDescriptionNormalizer {
    private StatementImportDescriptionNormalizer() {
    }

    static String normalize(String description) {
        return Normalizer.normalize(description == null ? "" : description, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\d+", " ")
                .replaceAll("[^a-z]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
