package com.fluxa.backend.projection;

import com.fluxa.backend.domain.enums.CategoryKind;

import java.util.UUID;

public interface CategoriesSelectProjection {
    UUID getId();
    String getName();
    CategoryKind getKind();
}
