package com.budgetbook.domain.transaction;

import com.budgetbook.domain.account.Account;
import com.budgetbook.domain.category.Category;
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
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transactions_account_id", columnList = "account_id"),
    @Index(name = "idx_transactions_category_id", columnList = "category_id"),
    @Index(name = "idx_transactions_type", columnList = "type"),
    @Index(name = "idx_transactions_date", columnList = "transaction_date"),
    @Index(name = "idx_transactions_account_date", columnList = "account_id,transaction_date")
})
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private com.budgetbook.domain.category.TransactionType type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(nullable = false)
    private LocalDateTime transactionDate;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Transaction(Account account, Category category, com.budgetbook.domain.category.TransactionType type, 
                      BigDecimal amount, String memo, LocalDateTime transactionDate) {
        this.account = account;
        this.category = category;
        this.type = type;
        this.amount = amount;
        this.memo = memo;
        this.transactionDate = transactionDate;
    }

    public void update(Category category, com.budgetbook.domain.category.TransactionType type, BigDecimal amount, 
                      String memo, LocalDateTime transactionDate) {
        this.category = category;
        this.type = type;
        this.amount = amount;
        this.memo = memo;
        this.transactionDate = transactionDate;
    }

    public boolean isOwner(Long userId) {
        return this.account.isOwner(userId);
    }
}
