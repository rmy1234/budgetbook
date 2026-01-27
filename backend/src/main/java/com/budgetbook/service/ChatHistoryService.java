package com.budgetbook.service;

import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.domain.chat.ChatMessage;
import com.budgetbook.domain.chat.ChatMessageRepository;
import com.budgetbook.domain.chat.MessageRole;
import com.budgetbook.domain.user.User;
import com.budgetbook.domain.user.UserRepository;
import com.budgetbook.dto.ai.AiParseResponse;
import com.budgetbook.dto.ai.ChatResponse.AccountData;
import com.budgetbook.dto.ai.ChatResponse.CategoryData;
import com.budgetbook.dto.chat.ChatMessageDto;
import com.budgetbook.dto.chat.SaveMessageRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ChatHistoryService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public List<ChatMessageDto> getChatHistory(Long userId) {
        List<ChatMessage> messages = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
        return messages.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @SuppressWarnings("null")
    public ChatMessageDto saveMessage(Long userId, SaveMessageRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("USER_001", "사용자를 찾을 수 없습니다"));

        MessageRole role;
        try {
            role = MessageRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("CHAT_001", "잘못된 역할입니다");
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .user(user)
                .role(role)
                .content(request.getContent())
                .actionType(request.getActionType())
                .transactionData(toJson(request.getTransaction()))
                .categoryData(toJson(request.getCategory()))
                .accountData(toJson(request.getAccount()))
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        return toDto(savedMessage);
    }

    @Transactional
    public void clearChatHistory(Long userId) {
        chatMessageRepository.deleteAllByUserId(userId);
    }

    public long getMessageCount(Long userId) {
        return chatMessageRepository.countByUserId(userId);
    }

    private ChatMessageDto toDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .role(message.getRole().name().toLowerCase())
                .content(message.getContent())
                .actionType(message.getActionType())
                .transaction(fromJson(message.getTransactionData(), AiParseResponse.class))
                .category(fromJson(message.getCategoryData(), CategoryData.class))
                .account(fromJson(message.getAccountData(), AccountData.class))
                .timestamp(message.getCreatedAt())
                .build();
    }

    private String toJson(Object object) {
        if (object == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            log.error("JSON 직렬화 실패: {}", e.getMessage());
            return null;
        }
    }

    private <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            log.error("JSON 역직렬화 실패: {}", e.getMessage());
            return null;
        }
    }
}
