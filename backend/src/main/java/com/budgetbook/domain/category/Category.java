package com.budgetbook.domain.category;

import com.budgetbook.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories", indexes = {
    @Index(name = "idx_categories_user_id", columnList = "user_id"),
    @Index(name = "idx_categories_type", columnList = "type")
})
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(length = 50)
    private String icon;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Category(User user, String name, TransactionType type, String icon) {
        this.user = user;
        this.name = name;
        this.type = type;
        this.icon = icon;
    }

    public void update(String name, String icon) {
        if (name != null) {
            this.name = name;
        }
        if (icon != null) {
            this.icon = icon;
        }
    }

    public boolean isOwner(Long userId) {
        return this.user.getId().equals(userId);
    }
}
