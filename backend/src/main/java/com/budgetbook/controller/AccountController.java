package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.dto.account.AccountCreateRequest;
import com.budgetbook.dto.account.AccountResponse;
import com.budgetbook.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAccounts(
            Authentication authentication,
            @RequestParam(required = false) String bankName) {
        Long userId = Long.parseLong(authentication.getName());
        
        List<AccountResponse> accounts;
        if (bankName != null && !bankName.isEmpty()) {
            accounts = accountService.getAccountsByBank(userId, bankName);
        } else {
            accounts = accountService.getAccounts(userId);
        }
        
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            Authentication authentication,
            @Valid @RequestBody AccountCreateRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        AccountResponse response = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "계좌가 생성되었습니다"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody AccountUpdateRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        AccountResponse response = accountService.updateAccount(userId, id, request.getAlias());
        return ResponseEntity.ok(ApiResponse.success(response, "계좌 정보가 수정되었습니다"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            Authentication authentication,
            @PathVariable Long id) {
        Long userId = Long.parseLong(authentication.getName());
        accountService.deleteAccount(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "계좌가 삭제되었습니다"));
    }

    @lombok.Getter
    @lombok.Setter
    private static class AccountUpdateRequest {
        private String alias;
    }
}
