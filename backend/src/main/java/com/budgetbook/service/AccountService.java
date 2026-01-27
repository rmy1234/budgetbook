package com.budgetbook.service;

import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.domain.account.Account;
import com.budgetbook.domain.account.AccountRepository;
import com.budgetbook.domain.user.User;
import com.budgetbook.domain.user.UserRepository;
import com.budgetbook.dto.account.AccountCreateRequest;
import com.budgetbook.dto.account.AccountResponse;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "accounts", key = "#userId")
    public List<AccountResponse> getAccounts(Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accounts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "accounts", key = "#userId + ':' + #bankName")
    public List<AccountResponse> getAccountsByBank(Long userId, String bankName) {
        List<Account> accounts = accountRepository.findByUserIdAndBankName(userId, bankName);
        return accounts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#userId")
    @SuppressWarnings("null")
    public AccountResponse createAccount(Long userId, AccountCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("USER_001", "사용자를 찾을 수 없습니다"));

        Account account = Account.builder()
                .user(user)
                .bankName(request.getBankName())
                .alias(request.getAlias())
                .balance(request.getBalance() != null ? request.getBalance() : BigDecimal.ZERO)
                .build();

        Account savedAccount = accountRepository.save(account);
        return toResponse(savedAccount);
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#userId")
    @SuppressWarnings("null")
    public AccountResponse updateAccount(Long userId, Long accountId, String alias, BigDecimal balance) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("ACCOUNT_001", "계좌를 찾을 수 없습니다"));

        if (!account.isOwner(userId)) {
            throw new BusinessException("ACCOUNT_002", "계좌 소유권이 없습니다");
        }

        if (alias != null) {
            account.updateAlias(alias);
        }
        if (balance != null) {
            account.updateBalance(balance);
        }
        Account savedAccount = accountRepository.save(account);
        return toResponse(savedAccount);
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#userId")
    @SuppressWarnings("null")
    public void deleteAccount(Long userId, Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("ACCOUNT_001", "계좌를 찾을 수 없습니다"));

        if (!account.isOwner(userId)) {
            throw new BusinessException("ACCOUNT_002", "계좌 소유권이 없습니다");
        }

        accountRepository.delete(account);
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .userId(account.getUser().getId())
                .bankName(account.getBankName())
                .alias(account.getAlias())
                .balance(account.getBalance())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
