package com.budgetbook.dto.transaction;

import com.budgetbook.domain.category.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class TransactionCreateRequest {
    
    @NotNull(message = "계좌 ID는 필수입니다")
    private Long accountId;

    @NotNull(message = "타입은 필수입니다")
    private TransactionType type;

    @NotNull(message = "금액은 필수입니다")
    @Positive(message = "금액은 0보다 커야 합니다")
    private BigDecimal amount;

    @NotNull(message = "카테고리 ID는 필수입니다")
    private Long categoryId;

    private String memo;

    @NotNull(message = "거래일시는 필수입니다")
    private LocalDateTime transactionDate;
}
