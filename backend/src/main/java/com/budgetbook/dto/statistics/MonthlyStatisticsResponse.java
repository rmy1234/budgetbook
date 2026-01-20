package com.budgetbook.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatisticsResponse {
    private int year;
    private int month;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private List<CategoryExpense> categoryExpenses;
    private List<CategoryExpense> categoryIncomes;
    private List<WeeklyExpense> weeklyExpenses;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryExpense {
        private Long categoryId;
        private String categoryName;
        private BigDecimal amount;
        private Double percentage;
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyExpense {
        private int week;
        private String startDate;
        private String endDate;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal balance;
    }
}
