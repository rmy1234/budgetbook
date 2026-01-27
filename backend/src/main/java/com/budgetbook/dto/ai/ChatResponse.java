package com.budgetbook.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    
    private String message;           // AI 응답 메시지
    private String actionType;        // CHAT, TRANSACTION, CATEGORY, ACCOUNT, HELP
    private boolean hasTransaction;   // 거래 내용 포함 여부
    private AiParseResponse transaction; // 거래 데이터 (optional)
    private CategoryData category;    // 카테고리 생성 데이터 (optional)
    private AccountData account;      // 계좌 생성 데이터 (optional)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryData {
        private String name;
        private String type;  // INCOME or EXPENSE
        private String icon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountData {
        private String bankName;
        private String alias;
        private Long balance;
    }
}
