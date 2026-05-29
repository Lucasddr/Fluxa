package com.fluxa.backend.dto.request;

import com.fluxa.backend.domain.enums.CategoryKind;

public record CreateCategoryDTO(
        String name,
        CategoryKind kind,
        String icon,
        String description,
        String color,
        Boolean status
) {
}
