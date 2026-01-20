package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.domain.category.TransactionType;
import com.budgetbook.dto.category.CategoryCreateRequest;
import com.budgetbook.dto.category.CategoryResponse;
import com.budgetbook.dto.category.CategoryUpdateRequest;
import com.budgetbook.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            Authentication authentication,
            @RequestParam(required = false) TransactionType type) {
        Long userId = Long.parseLong(authentication.getName());
        List<CategoryResponse> categories;
        if (type != null) {
            categories = categoryService.getCategoriesByType(userId, type);
        } else {
            categories = categoryService.getAllCategories(userId);
        }
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            Authentication authentication,
            @Valid @RequestBody CategoryCreateRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        CategoryResponse response = categoryService.createCategory(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "카테고리가 생성되었습니다"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        CategoryResponse response = categoryService.updateCategory(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "카테고리가 수정되었습니다"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            Authentication authentication,
            @PathVariable Long id) {
        Long userId = Long.parseLong(authentication.getName());
        categoryService.deleteCategory(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "카테고리가 삭제되었습니다"));
    }
}
