package com.budgetbook.domain.chat;

import com.budgetbook.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_messages_user_id", columnList = "user_id"),
    @Index(name = "idx_chat_messages_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 20)
    private String actionType;

    @Column(columnDefinition = "TEXT")
    private String transactionData;  // JSON 형태로 저장

    @Column(columnDefinition = "TEXT")
    private String categoryData;     // JSON 형태로 저장

    @Column(columnDefinition = "TEXT")
    private String accountData;      // JSON 형태로 저장

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatMessage(User user, MessageRole role, String content, String actionType,
                       String transactionData, String categoryData, String accountData) {
        this.user = user;
        this.role = role;
        this.content = content;
        this.actionType = actionType;
        this.transactionData = transactionData;
        this.categoryData = categoryData;
        this.accountData = accountData;
    }

    public boolean isOwner(Long userId) {
        return this.user.getId().equals(userId);
    }
}
