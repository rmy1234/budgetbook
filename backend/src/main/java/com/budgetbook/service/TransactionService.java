package com.budgetbook.service;

import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.domain.account.Account;
import com.budgetbook.domain.account.AccountRepository;
import com.budgetbook.domain.category.Category;
import com.budgetbook.domain.category.CategoryRepository;
import com.budgetbook.domain.category.TransactionType;
import com.budgetbook.domain.transaction.Transaction;
import com.budgetbook.domain.transaction.TransactionRepository;
import com.budgetbook.dto.transaction.TransactionCreateRequest;
import com.budgetbook.dto.transaction.TransactionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public Page<TransactionResponse> getTransactions(Long userId, Long accountId, Pageable pageable) {
        Page<Transaction> transactions;
        if (accountId != null) {
            transactions = transactionRepository.findByAccountUserIdAndAccountId(userId, accountId, pageable);
        } else {
            transactions = transactionRepository.findByAccountUserId(userId, pageable);
        }

        return transactions.map(this::toResponse);
    }

    public List<TransactionResponse> getTransactionsByDate(Long userId, java.time.LocalDate date) {
        LocalDateTime startDate = date.atStartOfDay();
        LocalDateTime endDate = date.atTime(23, 59, 59);
        List<Transaction> transactions = transactionRepository.findByUserIdAndDate(userId, startDate, endDate);
        return transactions.stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<TransactionResponse> getTransactionsByDateAndAccount(Long userId, java.time.LocalDate date, Long accountId) {
        LocalDateTime startDate = date.atStartOfDay();
        LocalDateTime endDate = date.atTime(23, 59, 59);
        List<Transaction> transactions;
        log.info("getTransactionsByDateAndAccount - userId: {}, date: {}, accountId: {}", userId, date, accountId);
        if (accountId != null && accountId > 0) {
            log.info("계좌 필터 적용 - accountId: {}", accountId);
            transactions = transactionRepository.findByUserIdAndDateAndAccountId(userId, startDate, endDate, accountId);
            log.info("계좌 필터 적용 결과 - 조회된 거래 수: {}", transactions.size());
        } else {
            log.info("전체 계좌 조회");
            transactions = transactionRepository.findByUserIdAndDate(userId, startDate, endDate);
            log.info("전체 계좌 조회 결과 - 조회된 거래 수: {}", transactions.size());
        }
        return transactions.stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"statistics", "transactions", "accounts"}, allEntries = true)
    @SuppressWarnings("null")
    public TransactionResponse createTransaction(Long userId, TransactionCreateRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new BusinessException("ACCOUNT_001", "계좌를 찾을 수 없습니다"));

        if (!account.isOwner(userId)) {
            throw new BusinessException("ACCOUNT_002", "계좌 소유권이 없습니다");
        }

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                .orElseThrow(() -> new BusinessException("CATEGORY_001", "카테고리를 찾을 수 없습니다"));

        Transaction transaction = Transaction.builder()
                .account(account)
                .category(category)
                .type(request.getType())
                .amount(request.getAmount())
                .memo(request.getMemo())
                .transactionDate(request.getTransactionDate())
                .build();

        // 계좌 잔액 업데이트
        BigDecimal oldBalance = account.getBalance();
        updateAccountBalance(account, request.getType(), request.getAmount());
        log.info("거래 생성 - 계좌 ID: {}, 타입: {}, 금액: {}, 이전 잔액: {}, 업데이트 후 잔액: {}", 
                account.getId(), request.getType(), request.getAmount(), oldBalance, account.getBalance());

        Transaction savedTransaction = transactionRepository.save(transaction);
        accountRepository.save(account); // 계좌 잔액 저장
        log.info("계좌 잔액 저장 완료 - 계좌 ID: {}, 최종 잔액: {}", account.getId(), account.getBalance());
        return toResponse(savedTransaction);
    }

    @Transactional
    @CacheEvict(value = {"statistics", "transactions", "accounts"}, allEntries = true)
    @SuppressWarnings("null")
    public TransactionResponse updateTransaction(Long userId, Long transactionId, TransactionCreateRequest request) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException("TRANSACTION_001", "거래 내역을 찾을 수 없습니다"));

        if (!transaction.isOwner(userId)) {
            throw new BusinessException("TRANSACTION_002", "거래 내역 소유권이 없습니다");
        }

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                .orElseThrow(() -> new BusinessException("CATEGORY_001", "카테고리를 찾을 수 없습니다"));

        Account account = transaction.getAccount();
        
        // 이전 거래 내역을 되돌림 (잔액 복구)
        reverseTransaction(account, transaction.getType(), transaction.getAmount());
        
        // 새 거래 내역으로 업데이트
        transaction.update(category, request.getType(), request.getAmount(), 
                          request.getMemo(), request.getTransactionDate());
        
        // 새 거래 내역 반영 (잔액 업데이트)
        updateAccountBalance(account, request.getType(), request.getAmount());

        Transaction savedTransaction = transactionRepository.save(transaction);
        accountRepository.save(account); // 계좌 잔액 저장
        return toResponse(savedTransaction);
    }

    @Transactional
    @CacheEvict(value = {"statistics", "transactions", "accounts"}, allEntries = true)
    @SuppressWarnings("null")
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException("TRANSACTION_001", "거래 내역을 찾을 수 없습니다"));

        if (!transaction.isOwner(userId)) {
            throw new BusinessException("TRANSACTION_002", "거래 내역 소유권이 없습니다");
        }

        Account account = transaction.getAccount();
        
        // 거래 내역을 되돌림 (잔액 복구)
        reverseTransaction(account, transaction.getType(), transaction.getAmount());
        
        transactionRepository.delete(transaction);
        accountRepository.save(account); // 계좌 잔액 저장
    }

    private void updateAccountBalance(Account account, TransactionType type, BigDecimal amount) {
        if (type == TransactionType.INCOME) {
            account.addBalance(amount);
        } else if (type == TransactionType.EXPENSE) {
            try {
                account.subtractBalance(amount);
            } catch (IllegalStateException e) {
                throw new BusinessException("TRANSACTION_002", "계좌 잔액이 부족합니다");
            }
        }
    }

    private void reverseTransaction(Account account, TransactionType type, BigDecimal amount) {
        if (type == TransactionType.INCOME) {
            account.subtractBalance(amount);
        } else if (type == TransactionType.EXPENSE) {
            account.addBalance(amount);
        }
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .accountId(transaction.getAccount().getId())
                .accountAlias(transaction.getAccount().getAlias())
                .accountBankName(transaction.getAccount().getBankName())
                .type(transaction.getType().name())
                .amount(transaction.getAmount())
                .categoryId(transaction.getCategory().getId())
                .categoryName(transaction.getCategory().getName())
                .memo(transaction.getMemo())
                .transactionDate(transaction.getTransactionDate())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
