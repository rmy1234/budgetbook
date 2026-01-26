package com.budgetbook.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiParseRequest {
    
    @NotBlank(message = "입력 텍스트는 필수입니다")
    private String text;
}
