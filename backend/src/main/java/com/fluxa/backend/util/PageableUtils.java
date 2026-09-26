package com.fluxa.backend.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

public final class PageableUtils {

    private static final int MAX_PAGE_SIZE = 100;

    private PageableUtils() {}

    public static Pageable limitPageSize(Pageable pageable) {

        if (pageable.getPageSize() <= MAX_PAGE_SIZE) {
            return pageable;
        }

        return PageRequest.of(
                pageable.getPageNumber(),
                MAX_PAGE_SIZE,
                pageable.getSort()
        );
    }
}