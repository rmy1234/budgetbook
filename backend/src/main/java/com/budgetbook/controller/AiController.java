package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.dto.ai.AiParseRequest;
import com.budgetbook.dto.ai.AiParseResponse;
import com.budgetbook.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

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
}
