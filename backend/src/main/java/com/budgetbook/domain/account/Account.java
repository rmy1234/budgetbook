package com.budgetbook.domain.account;

import com.budgetbook.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts", indexes = {
    @Index(name = "idx_accounts_user_id", columnList = "user_id"),
    @Index(name = "idx_accounts_bank_name", columnList = "bank_name")
})
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String bankName;

    @Column(length = 100)
    private String alias;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Account(User user, String bankName, String alias, BigDecimal balance) {
        this.user = user;
        this.bankName = bankName;
        this.alias = alias;
        this.balance = balance != null ? balance : BigDecimal.ZERO;
    }

    public void updateAlias(String alias) {
        this.alias = alias;
    }

    public void updateBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public void addBalance(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }

    public void subtractBalance(BigDecimal amount) {
        if (this.balance.compareTo(amount) < 0) {
            throw new IllegalStateException("계좌 잔액이 부족합니다");
        }
        this.balance = this.balance.subtract(amount);
    }

    public boolean isOwner(Long userId) {
        return this.user.getId().equals(userId);
    }
}
