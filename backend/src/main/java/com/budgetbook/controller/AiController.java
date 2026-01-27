package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.dto.ai.AiParseRequest;
import com.budgetbook.dto.ai.AiParseResponse;
import com.budgetbook.dto.ai.ChatRequest;
import com.budgetbook.dto.ai.ChatResponse;
import com.budgetbook.dto.chat.ChatMessageDto;
import com.budgetbook.dto.chat.SaveMessageRequest;
import com.budgetbook.service.AiService;
import com.budgetbook.service.ChatHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final ChatHistoryService chatHistoryService;

    @PostMapping("/parse-transaction")
    public ResponseEntity<ApiResponse<AiParseResponse>> parseTransaction(
            Authentication authentication,
            @Valid @RequestBody AiParseRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        AiParseResponse response = aiService.parseTransaction(userId, request.getText());
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(ApiResponse.success(response, "거래 내역 파싱 완료"));
        } else {
            return ResponseEntity.ok(ApiResponse.success(response, response.getErrorMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            Authentication authentication,
            @Valid @RequestBody ChatRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        ChatResponse response = aiService.chat(userId, request.getMessage());
        
        return ResponseEntity.ok(ApiResponse.success(response, "AI 응답 완료"));
    }

    @GetMapping("/chat/history")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getChatHistory(
            Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        List<ChatMessageDto> history = chatHistoryService.getChatHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history, "대화 내역 조회 완료"));
    }

    @PostMapping("/chat/history")
    public ResponseEntity<ApiResponse<ChatMessageDto>> saveMessage(
            Authentication authentication,
            @Valid @RequestBody SaveMessageRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        ChatMessageDto savedMessage = chatHistoryService.saveMessage(userId, request);
        return ResponseEntity.ok(ApiResponse.success(savedMessage, "메시지 저장 완료"));
    }

    @DeleteMapping("/chat/history")
    public ResponseEntity<ApiResponse<Void>> clearChatHistory(
            Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        chatHistoryService.clearChatHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "대화 내역 삭제 완료"));
    }
}
