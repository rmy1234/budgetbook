package com.budgetbook.dto.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountCreateRequest {
    
    @NotBlank(message = "은행명은 필수입니다")
    @Size(max = 100, message = "은행명은 100자 이하여야 합니다")
    private String bankName;

    @Size(max = 100, message = "별칭은 100자 이하여야 합니다")
    private String alias;

    private java.math.BigDecimal balance;
}
