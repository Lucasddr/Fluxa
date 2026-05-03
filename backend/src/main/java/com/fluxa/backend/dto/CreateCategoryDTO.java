package com.fluxa.backend.dto;

import com.fluxa.backend.domain.enums.CategoryKind;

public record CreateCategoryDTO(
        String name,
        CategoryKind kind
) {
}
