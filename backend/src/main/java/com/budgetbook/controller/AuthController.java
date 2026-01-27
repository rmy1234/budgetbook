package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.dto.auth.LoginRequest;
import com.budgetbook.dto.auth.SignupRequest;
import com.budgetbook.dto.auth.TokenResponse;
import com.budgetbook.dto.user.UserResponse;
import com.budgetbook.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
        var user = authService.signup(request);
        var response = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .age(user.getAge())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "회원가입이 완료되었습니다"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(tokenResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            Authentication authentication,
            @RequestBody RefreshTokenRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        if (request.getRefreshToken() != null) {
            authService.logout(userId, request.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "로그아웃되었습니다"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(@RequestBody RefreshTokenRequest request) {
        TokenResponse tokenResponse = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(tokenResponse));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<EmailAvailabilityResponse>> checkEmail(@RequestParam String email) {
        boolean available = authService.checkEmailAvailability(email);
        EmailAvailabilityResponse response = new EmailAvailabilityResponse(available, 
            available ? "사용 가능한 이메일입니다" : "이미 등록된 이메일입니다");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @lombok.Getter
    @lombok.Setter
    @lombok.AllArgsConstructor
    private static class EmailAvailabilityResponse {
        private boolean available;
        private String message;
    }

    @lombok.Getter
    @lombok.Setter
    private static class RefreshTokenRequest {
        private String refreshToken;
    }
}
