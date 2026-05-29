package com.fluxa.backend.repository;

import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.projection.CategoriesSelectProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository <Category, UUID> {

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    Page<Category> findCategoryByUserId(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    List<CategoriesSelectProjection> findAllProjectedByUserId(UUID userId);

}
