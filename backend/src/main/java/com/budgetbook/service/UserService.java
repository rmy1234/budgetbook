package com.budgetbook.service;

import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.domain.user.User;
import com.budgetbook.domain.user.UserRepository;
import com.budgetbook.dto.user.UserResponse;
import com.budgetbook.dto.user.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    @Cacheable(value = "user", key = "#userId")
    @SuppressWarnings("null")
    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("USER_001", "사용자를 찾을 수 없습니다"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .age(user.getAge())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Transactional
    @CacheEvict(value = "user", key = "#userId")
    @SuppressWarnings("null")
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("USER_001", "사용자를 찾을 수 없습니다"));

        if (request.getName() != null) {
            user.updateName(request.getName());
        }
        if (request.getAge() != null) {
            user.updateAge(request.getAge());
        }

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .age(savedUser.getAge())
                .createdAt(savedUser.getCreatedAt())
                .updatedAt(savedUser.getUpdatedAt())
                .build();
    }
}
