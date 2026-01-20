package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.dto.transaction.TransactionCreateRequest;
import com.budgetbook.dto.transaction.TransactionResponse;
import com.budgetbook.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) java.time.LocalDate date,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userId = Long.parseLong(authentication.getName());

        if (date != null) {
            // 날짜별 조회 (계좌 필터 포함)
            java.util.List<TransactionResponse> transactions = transactionService.getTransactionsByDateAndAccount(userId, date, accountId);
            return ResponseEntity.ok(ApiResponse.success(transactions));
        } else {
            // 페이지네이션 조회
            Page<TransactionResponse> transactions = transactionService.getTransactions(userId, accountId, pageable);
            return ResponseEntity.ok(ApiResponse.success(transactions));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            Authentication authentication,
            @Valid @RequestBody TransactionCreateRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        TransactionResponse response = transactionService.createTransaction(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "거래 내역이 생성되었습니다"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TransactionCreateRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        TransactionResponse response = transactionService.updateTransaction(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "거래 내역이 수정되었습니다"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            Authentication authentication,
            @PathVariable Long id) {
        Long userId = Long.parseLong(authentication.getName());
        transactionService.deleteTransaction(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "거래 내역이 삭제되었습니다"));
    }
}
