package com.fluxa.backend.dto.request;

import java.util.UUID;

public record DeleteCategoryDTO(
        UUID categoryId
) {
}
