import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { StatisticsService, MonthlyStatistics, WeeklyStatistics, YearlyStatistics } from '../../../core/services/statistics.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonToggleModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  selectedTab = 0;
  
  // 그래프 타입 (bar: 막대, line: 꺾은선)
  weeklyChartType: 'bar' | 'line' = 'bar';
  monthlyChartType: 'bar' | 'line' = 'bar';
  yearlyChartType: 'bar' | 'line' = 'bar';
  
  // 월별 통계
  monthlyStats: MonthlyStatistics | null = null;
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  loadingMonthly = false;
  
  // 주간 통계
  weeklyStats: WeeklyStatistics | null = null;
  selectedWeek = this.getCurrentWeek();
  selectedWeeklyMonth = new Date().getMonth() + 1;
  availableWeeks: number[] = [];
  loadingWeekly = false;
  
  // 연간 통계
  yearlyStats: YearlyStatistics | null = null;
  loadingYearly = false;

  years: number[] = [];
  months = [
    { value: 1, label: '1월' },
    { value: 2, label: '2월' },
    { value: 3, label: '3월' },
    { value: 4, label: '4월' },
    { value: 5, label: '5월' },
    { value: 6, label: '6월' },
    { value: 7, label: '7월' },
    { value: 8, label: '8월' },
    { value: 9, label: '9월' },
    { value: 10, label: '10월' },
    { value: 11, label: '11월' },
    { value: 12, label: '12월' }
  ];
  weeks: number[] = [];

  constructor(
    private statisticsService: StatisticsService,
    private snackBar: MatSnackBar
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
    // 주차 배열 생성 (1주차부터 53주차까지) - 전체 주차 목록용
    for (let i = 1; i <= 53; i++) {
      this.weeks.push(i);
    }
    // 초기 선택 가능한 주차 계산
    this.updateAvailableWeeks();
  }

  ngOnInit(): void {
    this.updateAvailableWeeks();
    this.loadWeeklyStatistics();
    this.loadYearlyStatistics();
  }

  getCurrentWeek(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  // 선택된 연도와 월에 해당하는 주차 범위 계산 (월 기준으로 1주차부터 시작)
  updateAvailableWeeks(): void {
    const startDate = new Date(this.selectedYear, this.selectedWeeklyMonth - 1, 1);
    const endDate = new Date(this.selectedYear, this.selectedWeeklyMonth, 0); // 해당 월의 마지막 날
    
    // 해당 월에 포함된 주의 개수 계산
    const weeksInMonth = this.getWeeksInMonth(startDate, endDate);
    
    this.availableWeeks = [];
    for (let week = 1; week <= weeksInMonth; week++) {
      this.availableWeeks.push(week);
    }
    
    // 선택된 주차가 유효한 범위를 벗어나면 첫 번째 주차로 설정
    if (this.selectedWeek < 1 || this.selectedWeek > weeksInMonth) {
      this.selectedWeek = 1;
    }
  }

  // 해당 월에 포함된 주의 개수 계산
  getWeeksInMonth(startDate: Date, endDate: Date): number {
    // 월의 첫 번째 날이 속한 주의 시작일(월요일)
    const firstDayOfWeek = startDate.getDay(); // 0: 일요일, 1: 월요일, ...
    const firstMonday = new Date(startDate);
    
    // 첫 번째 월요일 찾기
    if (firstDayOfWeek === 0) {
      // 일요일이면 다음 월요일로
      firstMonday.setDate(startDate.getDate() + 1);
    } else if (firstDayOfWeek !== 1) {
      // 월요일이 아니면 이전 월요일로
      firstMonday.setDate(startDate.getDate() - (firstDayOfWeek - 1));
    }
    
    // 월의 마지막 날이 속한 주의 마지막일(일요일)
    const lastDayOfWeek = endDate.getDay(); // 0: 일요일, 1: 월요일, ...
    const lastSunday = new Date(endDate);
    
    // 마지막 일요일 찾기
    if (lastDayOfWeek !== 0) {
      // 일요일이 아니면 다음 일요일로
      lastSunday.setDate(endDate.getDate() + (7 - lastDayOfWeek));
    }
    
    // 주의 개수 계산 (밀리초 단위 차이를 일 단위로 변환 후 7로 나눔)
    const daysDiff = Math.floor((lastSunday.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(daysDiff / 7) + 1;
    
    return weeks;
  }

  // 특정 날짜의 주차 번호 계산 (연도 기준)
  getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  // 월 기준 주차를 연도 기준 주차로 변환
  getYearWeekFromMonthWeek(monthWeek: number): number {
    const startDate = new Date(this.selectedYear, this.selectedWeeklyMonth - 1, 1);
    // 월의 첫 번째 주를 찾기
    const firstDayOfWeek = startDate.getDay();
    let firstWeekStart = new Date(startDate);
    
    // 첫 번째 월요일 찾기
    if (firstDayOfWeek === 0) {
      firstWeekStart.setDate(startDate.getDate() + 1);
    } else if (firstDayOfWeek !== 1) {
      firstWeekStart.setDate(startDate.getDate() - (firstDayOfWeek - 1));
    }
    
    // 선택된 주차의 시작일 계산
    const targetWeekStart = new Date(firstWeekStart);
    targetWeekStart.setDate(firstWeekStart.getDate() + (monthWeek - 1) * 7);
    
    // 연도 기준 주차 계산
    return this.getWeekNumber(targetWeekStart);
  }

  // 주별 통계용 연도 변경 핸들러
  onWeeklyYearChange(): void {
    this.updateAvailableWeeks();
    this.loadWeeklyStatistics();
  }

  // 주별 통계용 월 변경 핸들러
  onWeeklyMonthChange(): void {
    this.updateAvailableWeeks();
    this.loadWeeklyStatistics();
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    if (index === 0) {
      this.loadWeeklyStatistics();
    } else if (index === 1) {
      this.loadMonthlyStatistics();
    } else if (index === 2) {
      this.loadYearlyStatistics();
    }
  }

  loadMonthlyStatistics(): void {
    this.loadingMonthly = true;
    this.statisticsService.getMonthlyStatistics(this.selectedYear, this.selectedMonth).subscribe({
      next: (stats) => {
        this.monthlyStats = stats;
        this.loadingMonthly = false;
      },
      error: (err) => {
        this.snackBar.open('월별 통계를 불러오는데 실패했습니다', '닫기', { duration: 3000 });
        this.loadingMonthly = false;
        this.monthlyStats = null;
      }
    });
  }

  loadWeeklyStatistics(): void {
    this.loadingWeekly = true;
    // 월 기준 주차를 연도 기준 주차로 변환
    const yearWeek = this.getYearWeekFromMonthWeek(this.selectedWeek);
    this.statisticsService.getWeeklyStatistics(this.selectedYear, yearWeek).subscribe({
      next: (stats) => {
        this.weeklyStats = stats;
        this.loadingWeekly = false;
      },
      error: (err) => {
        this.snackBar.open('주간 통계를 불러오는데 실패했습니다', '닫기', { duration: 3000 });
        this.loadingWeekly = false;
        this.weeklyStats = null;
      }
    });
  }

  loadYearlyStatistics(): void {
    this.loadingYearly = true;
    this.statisticsService.getYearlyStatistics(this.selectedYear).subscribe({
      next: (stats) => {
        this.yearlyStats = stats;
        this.loadingYearly = false;
      },
      error: (err) => {
        this.snackBar.open('연간 통계를 불러오는데 실패했습니다', '닫기', { duration: 3000 });
        this.loadingYearly = false;
        this.yearlyStats = null;
      }
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  }

  getPercentage(amount: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100);
  }

  // 그래프 관련 메서드
  getMaxDailyAmount(): number {
    if (!this.weeklyStats?.dailyExpenses) return 0;
    return Math.max(
      ...this.weeklyStats.dailyExpenses.map(d => Math.max(d.income, d.expense))
    ) || 1;
  }

  getMaxWeeklyAmount(): number {
    if (!this.monthlyStats?.weeklyExpenses) return 0;
    return Math.max(
      ...this.monthlyStats.weeklyExpenses.map(w => Math.max(w.income, w.expense))
    ) || 1;
  }

  getMaxMonthlyAmount(): number {
    if (!this.yearlyStats?.monthlyExpenses) return 0;
    return Math.max(
      ...this.yearlyStats.monthlyExpenses.map(m => Math.max(m.income, m.expense))
    ) || 1;
  }

  getBarHeight(amount: number, maxAmount: number): number {
    if (maxAmount === 0) return 0;
    return Math.round((amount / maxAmount) * 100);
  }

  // 통합 Y축 위치 계산 (top %) - 막대 그래프, 꺾은선 그래프 공용
  getBarYAxisPosition(value: number, maxAmount: number): number {
    if (maxAmount === 0) return 100;
    return 100 - ((value / maxAmount) * 100);
  }

  // 통합 Y축 위치 계산 (top %) - 꺾은선 그래프용 별칭
  getUnifiedYAxisPosition(value: number, maxAmount: number): number {
    return this.getBarYAxisPosition(value, maxAmount);
  }

  // 통합 포인트 Y 위치 계산 (bottom %) - 꺾은선 그래프 포인트용
  getUnifiedPointY(value: number, maxAmount: number): number {
    if (maxAmount === 0) return 0;
    return (value / maxAmount) * 100;
  }

  getDayLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  }

  getWeekLabel(week: number): string {
    return `${week}주`;
  }

  getMonthLabel(month: number): string {
    return `${month}월`;
  }

  // 꺾은선 그래프 관련 메서드
  // SVG viewBox: 1000 x 200
  readonly SVG_WIDTH = 1000;
  readonly SVG_HEIGHT = 200;

  // 통합된 라인 포인트 계산 - Y축 눈금과 동일한 방식 사용
  getLinePoints(data: {income: number, expense: number}[], type: 'income' | 'expense', maxAmount: number): string {
    if (!data || data.length === 0) return '';
    const width = this.SVG_WIDTH / data.length;
    
    return data.map((item, index) => {
      const x = (index * width) + (width / 2);
      const value = type === 'income' ? item.income : item.expense;
      // Y좌표: 위에서부터 계산 (SVG 좌표계) - 패딩 없이 0~100% 범위
      const yPercent = maxAmount > 0 
        ? 100 - ((value / maxAmount) * 100)
        : 100;
      const y = (yPercent / 100) * this.SVG_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  getDailyLinePoints(type: 'income' | 'expense'): string {
    if (!this.weeklyStats?.dailyExpenses) return '';
    // Y축의 최대값(getYAxisValues의 첫 번째 요소)을 사용하여 그래프와 Y축을 일치시킴
    const yAxisValues = this.getYAxisValues(this.getMaxDailyAmount());
    const maxAmount = yAxisValues[0];
    return this.getLinePoints(this.weeklyStats.dailyExpenses, type, maxAmount);
  }

  getWeeklyLinePoints(type: 'income' | 'expense'): string {
    if (!this.monthlyStats?.weeklyExpenses) return '';
    const yAxisValues = this.getYAxisValues(this.getMaxWeeklyAmount());
    const maxAmount = yAxisValues[0];
    return this.getLinePoints(this.monthlyStats.weeklyExpenses, type, maxAmount);
  }

  getMonthlyLinePoints(type: 'income' | 'expense'): string {
    if (!this.yearlyStats?.monthlyExpenses) return '';
    const yAxisValues = this.getYAxisValues(this.getMaxMonthlyAmount());
    const maxAmount = yAxisValues[0];
    return this.getLinePoints(this.yearlyStats.monthlyExpenses, type, maxAmount);
  }

  getPointX(index: number, total: number): number {
    const width = 100 / total;
    return (index * width) + (width / 2);
  }

  // Y축 눈금 값 계산
  getYAxisValues(maxAmount: number): number[] {
    if (maxAmount === 0) return [0];
    // 적절한 눈금 간격 계산 - 더 촘촘한 간격으로 조정
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxAmount)));
    let step = magnitude / 2; // 기본 간격을 더 작게 설정
    
    // 눈금 개수가 4~8개 사이가 되도록 조정
    const tickCount = maxAmount / step;
    if (tickCount < 4) step = magnitude / 4;
    if (tickCount > 8) step = magnitude;
    
    const values: number[] = [];
    for (let v = 0; v <= maxAmount; v += step) {
      values.push(v);
    }
    // 최대값이 포함되지 않았으면 추가
    if (values[values.length - 1] < maxAmount) {
      values.push(Math.ceil(maxAmount / step) * step);
    }
    return values.reverse(); // 위에서 아래로 표시
  }

  // 금액 축약 표시 (만원, 억원 단위)
  formatAxisAmount(amount: number): string {
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(1).replace(/\.0$/, '') + '억';
    } else if (amount >= 10000) {
      return (amount / 10000).toFixed(0) + '만';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1).replace(/\.0$/, '') + '천';
    }
    return amount.toString();
  }
}
