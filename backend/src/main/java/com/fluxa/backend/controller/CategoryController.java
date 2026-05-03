package com.fluxa.backend.controller;

import com.fluxa.backend.dto.CreateCategoryDTO;
import com.fluxa.backend.service.CategoriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
