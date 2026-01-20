package com.budgetbook.service;

import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.domain.category.Category;
import com.budgetbook.domain.category.CategoryRepository;
import com.budgetbook.domain.category.TransactionType;
import com.budgetbook.domain.transaction.TransactionRepository;
import com.budgetbook.domain.user.User;
import com.budgetbook.domain.user.UserRepository;
import com.budgetbook.dto.category.CategoryCreateRequest;
import com.budgetbook.dto.category.CategoryResponse;
import com.budgetbook.dto.category.CategoryUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "categories", key = "#userId")
    public List<CategoryResponse> getAllCategories(Long userId) {
        List<Category> categories = categoryRepository.findByUserId(userId);
        return categories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "categories", key = "#userId + ':' + #type")
    public List<CategoryResponse> getCategoriesByType(Long userId, TransactionType type) {
        List<Category> categories = categoryRepository.findByUserIdAndType(userId, type);
        return categories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    @SuppressWarnings("null")
    public CategoryResponse createCategory(Long userId, CategoryCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("USER_001", "사용자를 찾을 수 없습니다"));

        Category category = Category.builder()
                .user(user)
                .name(request.getName())
                .type(request.getType())
                .icon(request.getIcon())
                .build();

        Category savedCategory = categoryRepository.save(category);
        return toResponse(savedCategory);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    @SuppressWarnings("null")
    public CategoryResponse updateCategory(Long userId, Long categoryId, CategoryUpdateRequest request) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new BusinessException("CATEGORY_001", "카테고리를 찾을 수 없습니다"));

        category.update(request.getName(), request.getIcon());
        Category savedCategory = categoryRepository.save(category);
        return toResponse(savedCategory);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    @SuppressWarnings("null")
    public void deleteCategory(Long userId, Long categoryId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new BusinessException("CATEGORY_001", "카테고리를 찾을 수 없습니다"));

        // 사용 중인 거래 내역이 있는지 확인 (해당 사용자의 거래만 확인)
        if (transactionRepository.existsByCategoryIdAndAccountUserId(categoryId, userId)) {
            throw new BusinessException("CATEGORY_002", "사용 중인 카테고리는 삭제할 수 없습니다");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType().name())
                .icon(category.getIcon())
                .build();
    }
}
