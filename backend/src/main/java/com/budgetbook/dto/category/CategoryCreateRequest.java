package com.budgetbook.dto.category;

import com.budgetbook.domain.category.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryCreateRequest {
    
    @NotBlank(message = "카테고리명은 필수입니다")
    @Size(max = 50, message = "카테고리명은 50자 이하여야 합니다")
    private String name;

    @NotNull(message = "타입은 필수입니다")
    private TransactionType type;

    @Size(max = 50, message = "아이콘은 50자 이하여야 합니다")
    private String icon;
}
