package com.budgetbook.domain.transaction;

import com.budgetbook.domain.category.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Page<Transaction> findByAccountUserId(Long userId, Pageable pageable);
    
    Page<Transaction> findByAccountUserIdAndAccountId(Long userId, Long accountId, Pageable pageable);
    
    Page<Transaction> findByAccountUserIdAndType(Long userId, TransactionType type, Pageable pageable);
    
    Page<Transaction> findByAccountUserIdAndCategoryId(Long userId, Long categoryId, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND t.transactionDate >= :startDate AND t.transactionDate <= :endDate")
    List<Transaction> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND t.transactionDate >= :startDate AND t.transactionDate < :endDate")
    List<Transaction> findByUserIdAndYearMonth(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND t.transactionDate >= :startDate AND t.transactionDate < :endDate")
    List<Transaction> findByUserIdAndYear(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND t.transactionDate >= :startDate AND t.transactionDate < :endDate")
    List<Transaction> findByUserIdAndDate(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND t.transactionDate >= :startDate AND t.transactionDate <= :endDate " +
           "AND t.account.id = :accountId")
    List<Transaction> findByUserIdAndDateAndAccountId(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("accountId") Long accountId
    );
    
    boolean existsByCategoryId(Long categoryId);
    
    @Query("SELECT COUNT(t) > 0 FROM Transaction t " +
           "WHERE t.category.id = :categoryId AND t.account.user.id = :userId")
    boolean existsByCategoryIdAndAccountUserId(@Param("categoryId") Long categoryId, @Param("userId") Long userId);
}
