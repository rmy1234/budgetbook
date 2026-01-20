package com.budgetbook.controller;

import com.budgetbook.common.ApiResponse;
import com.budgetbook.common.exception.BusinessException;
import com.budgetbook.dto.statistics.MonthlyStatisticsResponse;
import com.budgetbook.dto.statistics.WeeklyStatisticsResponse;
import com.budgetbook.dto.statistics.YearlyStatisticsResponse;
import com.budgetbook.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<MonthlyStatisticsResponse>> getMonthlyStatistics(
            Authentication authentication,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            Long userId = Long.parseLong(authentication.getName());
            MonthlyStatisticsResponse response = statisticsService.getMonthlyStatistics(userId, year, month);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            throw new BusinessException("STATISTICS_001", "월별 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<WeeklyStatisticsResponse>> getWeeklyStatistics(
            Authentication authentication,
            @RequestParam int year,
            @RequestParam int week) {
        try {
            Long userId = Long.parseLong(authentication.getName());
            WeeklyStatisticsResponse response = statisticsService.getWeeklyStatistics(userId, year, week);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            throw new BusinessException("STATISTICS_002", "주간 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/yearly")
    public ResponseEntity<ApiResponse<YearlyStatisticsResponse>> getYearlyStatistics(
            Authentication authentication,
            @RequestParam int year) {
        try {
            Long userId = Long.parseLong(authentication.getName());
            YearlyStatisticsResponse response = statisticsService.getYearlyStatistics(userId, year);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            throw new BusinessException("STATISTICS_003", "연간 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
