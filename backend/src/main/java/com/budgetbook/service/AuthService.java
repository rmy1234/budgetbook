package com.budgetbook.service;

import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.domain.user.User;
import com.budgetbook.domain.user.UserRepository;
import com.budgetbook.domain.user.UserRole;
import com.budgetbook.dto.auth.LoginRequest;
import com.budgetbook.dto.auth.SignupRequest;
import com.budgetbook.dto.auth.TokenResponse;
import com.budgetbook.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;

    @SuppressWarnings("null")
    public User signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("USER_002", "이미 등록된 이메일입니다");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .age(request.getAge())
                .role(UserRole.USER)
                .build();

        return userRepository.save(user);
    }

    @SuppressWarnings("null")
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("AUTH_001", "이메일 또는 비밀번호가 올바르지 않습니다"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("AUTH_001", "이메일 또는 비밀번호가 올바르지 않습니다");
        }

        String tokenId = UUID.randomUUID().toString();
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), tokenId);

        // Refresh Token을 Redis에 저장 (7일)
        String refreshTokenKey = "refresh_token:" + user.getId() + ":" + tokenId;
        redisTemplate.opsForValue().set(
                refreshTokenKey,
                refreshToken,
                Duration.ofDays(7)
        );

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .build();
    }

    public void logout(Long userId, String refreshToken) {
        String tokenId = tokenProvider.getTokenIdFromToken(refreshToken);
        String refreshTokenKey = "refresh_token:" + userId + ":" + tokenId;
        redisTemplate.delete(refreshTokenKey);
    }

    @SuppressWarnings("null")
    public TokenResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("AUTH_002", "토큰이 만료되었습니다");
        }

        Long userId = tokenProvider.getUserIdFromToken(refreshToken);
        String tokenId = tokenProvider.getTokenIdFromToken(refreshToken);
        String refreshTokenKey = "refresh_token:" + userId + ":" + tokenId;

        // Redis에서 Refresh Token 확인
        Object storedToken = redisTemplate.opsForValue().get(refreshTokenKey);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new BusinessException("AUTH_001", "유효하지 않은 토큰입니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("USER_001", "사용자를 찾을 수 없습니다"));

        // 새로운 Access Token 생성
        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .build();
    }
}
