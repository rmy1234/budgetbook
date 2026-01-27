package com.budgetbook.dto.chat;

import com.budgetbook.dto.ai.AiParseResponse;
import com.budgetbook.dto.ai.ChatResponse.AccountData;
import com.budgetbook.dto.ai.ChatResponse.CategoryData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long id;
    private String role;           // USER, ASSISTANT
    private String content;
    private String actionType;     // CHAT, TRANSACTION, CATEGORY, ACCOUNT, HELP
    private AiParseResponse transaction;
    private CategoryData category;
    private AccountData account;
    private LocalDateTime timestamp;
}
