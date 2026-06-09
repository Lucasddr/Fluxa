package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.CreateCategoryDTO;
import com.fluxa.backend.dto.request.DeleteCategoryDTO;
import com.fluxa.backend.projection.CategoriesSelectProjection;
import com.fluxa.backend.service.CategoriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RequestMapping("/categories")
@RestController
public class CategoryController {

    public final CategoriesService categoriesService;

    @PostMapping("/create")
    public ResponseEntity<?> createCategory(@RequestBody CreateCategoryDTO dto){

        categoriesService.createCategory(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Created"

        ));
    }

    @GetMapping("/getCategories")
    public ResponseEntity<?> getCategories() {

        return ResponseEntity.ok(
                categoriesService.ListCategories()
        );
    }

    @GetMapping("/getCategoriesSelect")
    public ResponseEntity<List<CategoriesSelectProjection>> getCategoriesSelect() {

        return ResponseEntity.ok(
                categoriesService.listSelectCategories()

        );
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCategories(@RequestBody DeleteCategoryDTO dto) {
        categoriesService.deleteCategory(dto.categoryId());

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "message", "Categoria deletada com sucesso",
                    "categoryId", dto.categoryId()
        ));
    }
}
