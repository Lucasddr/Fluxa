package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.create.CreateCategoryDTO;
import com.fluxa.backend.dto.request.update.UpdateCategoryDTO;
import com.fluxa.backend.projection.CategoriesSelectProjection;
import com.fluxa.backend.service.CategoriesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@RequestMapping("/categories")
@RestController
public class CategoryController {

    private final CategoriesService categoriesService;

    @PostMapping("/create")
    public ResponseEntity<?> createCategory(@Valid @RequestBody CreateCategoryDTO dto){

        categoriesService.createCategory(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Created"

        ));
    }

    @GetMapping
    public ResponseEntity<?> getCategories() {

        return ResponseEntity.ok(
                categoriesService.listCategories()
        );
    }

    @GetMapping("/select")
    public ResponseEntity<List<CategoriesSelectProjection>> getCategoriesSelect() {

        return ResponseEntity.ok(
                categoriesService.listSelectCategories()

        );
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> deleteCategories(@PathVariable UUID categoryId) {
        categoriesService.deleteCategory(categoryId);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "message", "Categoria deletada com sucesso",
                    "categoryId", categoryId
        ));
    }

    @PatchMapping("/{categoryId}")
    public ResponseEntity<?> updateCategory(@PathVariable UUID categoryId,
                                            @Valid @RequestBody UpdateCategoryDTO dto) {
        categoriesService.updateCategory(categoryId, dto);

        return ResponseEntity.ok(
                Map.of("message", "Categoria atualizada com sucesso")
        );
    }
}
