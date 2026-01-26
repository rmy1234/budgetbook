package com.budgetbook.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiParseResponse {
    
    private String type;  // "INCOME" or "EXPENSE"
    private Long amount;
    private String categoryName;
    private Long categoryId;  // matched category ID if found
    private String memo;
    private Double confidence;
    private boolean success;
    private String errorMessage;
}
