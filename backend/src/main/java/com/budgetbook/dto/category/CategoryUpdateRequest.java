package com.budgetbook.dto.category;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryUpdateRequest {
    
    @Size(max = 50, message = "카테고리명은 50자 이하여야 합니다")
    private String name;

    @Size(max = 50, message = "아이콘은 50자 이하여야 합니다")
    private String icon;
}
