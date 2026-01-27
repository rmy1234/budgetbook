package com.budgetbook.dto.chat;

import com.budgetbook.dto.ai.AiParseResponse;
import com.budgetbook.dto.ai.ChatResponse.AccountData;
import com.budgetbook.dto.ai.ChatResponse.CategoryData;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveMessageRequest {
    @NotBlank(message = "역할은 필수입니다")
    private String role;           // USER, ASSISTANT
    
    @NotBlank(message = "내용은 필수입니다")
    private String content;
    
    private String actionType;     // CHAT, TRANSACTION, CATEGORY, ACCOUNT, HELP
    private AiParseResponse transaction;
    private CategoryData category;
    private AccountData account;
}
