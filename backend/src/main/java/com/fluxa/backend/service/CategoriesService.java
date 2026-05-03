package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.CreateCategoryDTO;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class CategoriesService {

    public final CategoryRepository categoryRepository;
    public final UserRepository userRepository;

    public void createCategory(CreateCategoryDTO dto){

        UUID userId = UserContext.getUserId();

        log.info("USER ID CONTEXT: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = new Category();

        category.setUser(user);
        category.setName(dto.name());
        category.setKind(dto.kind());

        categoryRepository.save(category);
    }

}
