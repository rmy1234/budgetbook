package com.budgetbook.service;

import com.budgetbook.domain.category.TransactionType;
import com.budgetbook.domain.transaction.Transaction;
import com.budgetbook.domain.transaction.TransactionRepository;
import com.budgetbook.dto.statistics.MonthlyStatisticsResponse;
import com.budgetbook.dto.statistics.WeeklyStatisticsResponse;
import com.budgetbook.dto.statistics.YearlyStatisticsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private final TransactionRepository transactionRepository;

    public MonthlyStatisticsResponse getMonthlyStatistics(Long userId, int year, int month) {
        if (month < 1 || month > 12) {
            throw new com.budgetbook.common.exception.BusinessException("STATISTICS_001", "월은 1부터 12 사이의 값이어야 합니다");
        }
        if (year < 1900 || year > 2100) {
            throw new com.budgetbook.common.exception.BusinessException("STATISTICS_001", "연도는 1900부터 2100 사이의 값이어야 합니다");
        }
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1);
        log.debug("월별 통계 조회 - userId: {}, year: {}, month: {}, startDate: {}, endDate: {}", 
                userId, year, month, startDate, endDate);
        List<Transaction> transactions = transactionRepository.findByUserIdAndYearMonth(userId, startDate, endDate);
        log.debug("조회된 거래 내역 수: {}", transactions.size());
        
        // 카테고리와 계좌 정보를 명시적으로 로드 (Lazy Loading 방지)
        transactions.forEach(t -> {
            try {
                t.getCategory().getName(); // 카테고리 로드
                t.getAccount().getAlias(); // 계좌 로드
            } catch (Exception e) {
                log.warn("거래 내역 로드 중 오류 발생 - transactionId: {}, error: {}", t.getId(), e.getMessage());
            }
        });

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = totalIncome.subtract(totalExpense);

        // 카테고리별 지출 집계
        Map<Long, BigDecimal> categoryExpenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        List<MonthlyStatisticsResponse.CategoryExpense> categoryExpenseList = categoryExpenses.entrySet().stream()
                .map(entry -> {
                    Long categoryId = entry.getKey();
                    BigDecimal amount = entry.getValue();
                    String categoryName = transactions.stream()
                            .filter(t -> t.getCategory().getId().equals(categoryId))
                            .findFirst()
                            .map(t -> t.getCategory().getName())
                            .orElse("");

                    double percentage = totalExpense.compareTo(BigDecimal.ZERO) > 0
                            ? amount.divide(totalExpense, 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue()
                            : 0.0;

                    return MonthlyStatisticsResponse.CategoryExpense.builder()
                            .categoryId(categoryId)
                            .categoryName(categoryName)
                            .amount(amount)
                            .percentage(percentage)
                            .build();
                })
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .collect(Collectors.toList());

        // 카테고리별 수입 집계
        Map<Long, BigDecimal> categoryIncomes = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        List<MonthlyStatisticsResponse.CategoryExpense> categoryIncomeList = categoryIncomes.entrySet().stream()
                .map(entry -> {
                    Long categoryId = entry.getKey();
                    BigDecimal amount = entry.getValue();
                    String categoryName = transactions.stream()
                            .filter(t -> t.getCategory().getId().equals(categoryId))
                            .findFirst()
                            .map(t -> t.getCategory().getName())
                            .orElse("");

                    double percentage = totalIncome.compareTo(BigDecimal.ZERO) > 0
                            ? amount.divide(totalIncome, 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue()
                            : 0.0;

                    return MonthlyStatisticsResponse.CategoryExpense.builder()
                            .categoryId(categoryId)
                            .categoryName(categoryName)
                            .amount(amount)
                            .percentage(percentage)
                            .build();
                })
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .collect(Collectors.toList());

        // 주별 집계
        List<MonthlyStatisticsResponse.WeeklyExpense> weeklyExpenseList = calculateWeeklyExpenses(
                transactions, year, month);

        return MonthlyStatisticsResponse.builder()
                .year(year)
                .month(month)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .categoryExpenses(categoryExpenseList)
                .categoryIncomes(categoryIncomeList)
                .weeklyExpenses(weeklyExpenseList)
                .build();
    }

    public WeeklyStatisticsResponse getWeeklyStatistics(Long userId, int year, int week) {
        if (year < 1900 || year > 2100) {
            throw new com.budgetbook.common.exception.BusinessException("STATISTICS_002", "연도는 1900부터 2100 사이의 값이어야 합니다");
        }
        if (week < 1 || week > 53) {
            throw new com.budgetbook.common.exception.BusinessException("STATISTICS_002", "주차는 1부터 53 사이의 값이어야 합니다");
        }
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        LocalDate startDate = LocalDate.of(year, 1, 1)
                .with(weekFields.weekOfWeekBasedYear(), week)
                .with(weekFields.dayOfWeek(), 1);
        LocalDate endDate = startDate.plusDays(6);
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        log.debug("주간 통계 조회 - userId: {}, year: {}, week: {}, startDate: {}, endDate: {}", 
                userId, year, week, startDateTime, endDateTime);
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateRange(
                userId, startDateTime, endDateTime);
        log.debug("조회된 거래 내역 수: {}", transactions.size());
        
        // 카테고리와 계좌 정보를 명시적으로 로드 (Lazy Loading 방지)
        transactions.forEach(t -> {
            try {
                t.getCategory().getName(); // 카테고리 로드
                t.getAccount().getAlias(); // 계좌 로드
            } catch (Exception e) {
                log.warn("거래 내역 로드 중 오류 발생 - transactionId: {}, error: {}", t.getId(), e.getMessage());
            }
        });

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = totalIncome.subtract(totalExpense);

        // 일별 집계
        Map<LocalDate, List<Transaction>> dailyTransactions = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getTransactionDate().toLocalDate()));

        List<WeeklyStatisticsResponse.DailyExpense> dailyExpenses = startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    List<Transaction> dayTransactions = dailyTransactions.getOrDefault(date, List.of());
                    BigDecimal dayIncome = dayTransactions.stream()
                            .filter(t -> t.getType() == TransactionType.INCOME)
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal dayExpense = dayTransactions.stream()
                            .filter(t -> t.getType() == TransactionType.EXPENSE)
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal dayBalance = dayIncome.subtract(dayExpense);

                    return WeeklyStatisticsResponse.DailyExpense.builder()
                            .date(date)
                            .income(dayIncome)
                            .expense(dayExpense)
                            .balance(dayBalance)
                            .build();
                })
                .collect(Collectors.toList());

        // 카테고리별 지출 집계
        List<WeeklyStatisticsResponse.CategoryAmount> categoryExpenseList = 
                calculateCategoryAmounts(transactions, TransactionType.EXPENSE, totalExpense);

        // 카테고리별 수입 집계
        List<WeeklyStatisticsResponse.CategoryAmount> categoryIncomeList = 
                calculateCategoryAmounts(transactions, TransactionType.INCOME, totalIncome);

        return WeeklyStatisticsResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .dailyExpenses(dailyExpenses)
                .categoryExpenses(categoryExpenseList)
                .categoryIncomes(categoryIncomeList)
                .build();
    }

    public YearlyStatisticsResponse getYearlyStatistics(Long userId, int year) {
        if (year < 1900 || year > 2100) {
            throw new com.budgetbook.common.exception.BusinessException("STATISTICS_003", "연도는 1900부터 2100 사이의 값이어야 합니다");
        }
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0, 0);
        LocalDateTime endDate = startDate.plusYears(1);
        log.debug("연간 통계 조회 - userId: {}, year: {}, startDate: {}, endDate: {}", 
                userId, year, startDate, endDate);
        List<Transaction> transactions = transactionRepository.findByUserIdAndYear(userId, startDate, endDate);
        log.debug("조회된 거래 내역 수: {}", transactions.size());
        
        // 카테고리와 계좌 정보를 명시적으로 로드 (Lazy Loading 방지)
        transactions.forEach(t -> {
            try {
                t.getCategory().getName(); // 카테고리 로드
                t.getAccount().getAlias(); // 계좌 로드
            } catch (Exception e) {
                log.warn("거래 내역 로드 중 오류 발생 - transactionId: {}, error: {}", t.getId(), e.getMessage());
            }
        });

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = totalIncome.subtract(totalExpense);

        // 월별 집계
        Map<Integer, List<Transaction>> monthlyTransactions = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getTransactionDate().getMonthValue()));

        List<YearlyStatisticsResponse.MonthlyExpense> monthlyExpenses = java.util.stream.IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    List<Transaction> monthTransactions = monthlyTransactions.getOrDefault(month, List.of());
                    BigDecimal monthIncome = monthTransactions.stream()
                            .filter(t -> t.getType() == TransactionType.INCOME)
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal monthExpense = monthTransactions.stream()
                            .filter(t -> t.getType() == TransactionType.EXPENSE)
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal monthBalance = monthIncome.subtract(monthExpense);

                    return YearlyStatisticsResponse.MonthlyExpense.builder()
                            .month(month)
                            .income(monthIncome)
                            .expense(monthExpense)
                            .balance(monthBalance)
                            .build();
                })
                .collect(Collectors.toList());

        // 카테고리별 지출 집계
        List<YearlyStatisticsResponse.CategoryAmount> categoryExpenseList = 
                calculateYearlyCategoryAmounts(transactions, TransactionType.EXPENSE, totalExpense);

        // 카테고리별 수입 집계
        List<YearlyStatisticsResponse.CategoryAmount> categoryIncomeList = 
                calculateYearlyCategoryAmounts(transactions, TransactionType.INCOME, totalIncome);

        return YearlyStatisticsResponse.builder()
                .year(year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .monthlyExpenses(monthlyExpenses)
                .categoryExpenses(categoryExpenseList)
                .categoryIncomes(categoryIncomeList)
                .build();
    }

    private List<MonthlyStatisticsResponse.WeeklyExpense> calculateWeeklyExpenses(
            List<Transaction> transactions, int year, int month) {
        LocalDate firstDayOfMonth = LocalDate.of(year, month, 1);
        LocalDate lastDayOfMonth = firstDayOfMonth.plusMonths(1).minusDays(1);
        
        java.util.List<MonthlyStatisticsResponse.WeeklyExpense> weeklyExpenses = new java.util.ArrayList<>();
        
        // 월의 첫 주 시작일 계산 (월요일 기준)
        LocalDate weekStart = firstDayOfMonth;
        int weekNumber = 1;
        
        while (!weekStart.isAfter(lastDayOfMonth)) {
            // 주의 끝 계산 (일요일 또는 월의 마지막 날)
            LocalDate weekEnd = weekStart.plusDays(6);
            if (weekEnd.isAfter(lastDayOfMonth)) {
                weekEnd = lastDayOfMonth;
            }
            
            final LocalDate finalWeekStart = weekStart;
            final LocalDate finalWeekEnd = weekEnd;
            
            // 해당 주의 거래 필터링
            List<Transaction> weekTransactions = transactions.stream()
                    .filter(t -> {
                        LocalDate txDate = t.getTransactionDate().toLocalDate();
                        return !txDate.isBefore(finalWeekStart) && !txDate.isAfter(finalWeekEnd);
                    })
                    .collect(Collectors.toList());
            
            BigDecimal weekIncome = weekTransactions.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal weekExpense = weekTransactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal weekBalance = weekIncome.subtract(weekExpense);
            
            weeklyExpenses.add(MonthlyStatisticsResponse.WeeklyExpense.builder()
                    .week(weekNumber)
                    .startDate(weekStart.toString())
                    .endDate(weekEnd.toString())
                    .income(weekIncome)
                    .expense(weekExpense)
                    .balance(weekBalance)
                    .build());
            
            weekStart = weekEnd.plusDays(1);
            weekNumber++;
        }
        
        return weeklyExpenses;
    }

    private List<WeeklyStatisticsResponse.CategoryAmount> calculateCategoryAmounts(
            List<Transaction> transactions, TransactionType type, BigDecimal total) {
        Map<Long, BigDecimal> categoryAmounts = transactions.stream()
                .filter(t -> t.getType() == type)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        return categoryAmounts.entrySet().stream()
                .map(entry -> {
                    Long categoryId = entry.getKey();
                    BigDecimal amount = entry.getValue();
                    String categoryName = transactions.stream()
                            .filter(t -> t.getCategory().getId().equals(categoryId))
                            .findFirst()
                            .map(t -> t.getCategory().getName())
                            .orElse("");

                    double percentage = total.compareTo(BigDecimal.ZERO) > 0
                            ? amount.divide(total, 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue()
                            : 0.0;

                    return WeeklyStatisticsResponse.CategoryAmount.builder()
                            .categoryId(categoryId)
                            .categoryName(categoryName)
                            .amount(amount)
                            .percentage(percentage)
                            .build();
                })
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .collect(Collectors.toList());
    }

    private List<YearlyStatisticsResponse.CategoryAmount> calculateYearlyCategoryAmounts(
            List<Transaction> transactions, TransactionType type, BigDecimal total) {
        Map<Long, BigDecimal> categoryAmounts = transactions.stream()
                .filter(t -> t.getType() == type)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        return categoryAmounts.entrySet().stream()
                .map(entry -> {
                    Long categoryId = entry.getKey();
                    BigDecimal amount = entry.getValue();
                    String categoryName = transactions.stream()
                            .filter(t -> t.getCategory().getId().equals(categoryId))
                            .findFirst()
                            .map(t -> t.getCategory().getName())
                            .orElse("");

                    double percentage = total.compareTo(BigDecimal.ZERO) > 0
                            ? amount.divide(total, 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue()
                            : 0.0;

                    return YearlyStatisticsResponse.CategoryAmount.builder()
                            .categoryId(categoryId)
                            .categoryName(categoryName)
                            .amount(amount)
                            .percentage(percentage)
                            .build();
                })
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .collect(Collectors.toList());
    }
}
