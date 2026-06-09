package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.dto.response.CategoryResponseDTO;
import com.fluxa.backend.dto.request.CreateCategoryDTO;
import com.fluxa.backend.projection.CategoriesSelectProjection;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
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
        category.setIcon(dto.icon());
        category.setDescription(dto.description());
        category.setColor(dto.color());
        category.setActive(dto.status());

        categoryRepository.save(category);

        log.info("[CATEGORIES] new category created: name: {} | user: {} | kind: {}",
                category.getName(),
                category.getUser().getId(),
                category.getKind()
        );
    }

    public void createDefaultCategories(User user){

        List<Category> categories = List.of(
                new Category(user, "Salário", CategoryKind.INCOME, "DollarSign", "#22C55E", true, "Recebimento de salário"),
                new Category(user, "Mercado", CategoryKind.EXPENSE, "ShoppingCart", "#F59E0B", true, "Compras em mercado"),
                new Category(user, "Educação", CategoryKind.EXPENSE, "GraduationCap", "#14B8A6", true, "Investimentos em educação")
        );

        categoryRepository.saveAll(categories);

        log.info("[CATEGORIES] default categories created to user: {}",
                user.getId()
        );
    }

    public Page<CategoryResponseDTO> findCategories(
            UUID userId,
            Pageable pageable
    ){
        return categoryRepository
                .findCategoryByUserId(userId, pageable)
                .map(this::toDTO);
    }

    private CategoryResponseDTO toDTO (Category category) {

        return new CategoryResponseDTO(
               category.getId(),
               category.getName(),
               category.getKind().toString(),
               category.getColor(),
               category.getIcon(),
               category.getDescription(),
               category.isActive()
        );
    }

    public Page<?> ListCategories (){

        UUID userId = UserContext.getUserId();

        Page<CategoryResponseDTO> categoriesList =
        this.categoryRepository
                .findCategoryByUserId(userId, PageRequest.of(0, 10))
                .map(category -> new CategoryResponseDTO(
                        category.getId(),
                        category.getName(),
                        category.getKind().toString(),
                        category.getIcon(),
                        category.getColor(),
                        category.getDescription(),
                        category.isActive()
                ));

        return categoriesList;
    }

    public List<CategoriesSelectProjection> listSelectCategories() {

        UUID userId = UserContext.getUserId();

        return categoryRepository.findAllProjectedByUserId(userId);
    }

    public void deleteCategory(UUID categoryId) {

        Boolean exists = categoryRepository.existsById(categoryId);

        if(exists){
            categoryRepository.deleteById(categoryId);
        } else {
            throw new RuntimeException("Categoria não encontrada");
        }

    }
}
