import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Transaction, TransactionService } from '../../../core/services/transaction.service';
import { Category, CategoryService } from '../../../core/services/category.service';

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  isHoliday: boolean;
  transactions: Transaction[];
}

export type ViewMode = 'weekly' | 'monthly' | 'yearly';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Output() dayClick = new EventEmitter<CalendarDay>();
  @Output() dateChange = new EventEmitter<Date>();

  currentDate = new Date();
  formattedDate: string = '';
  isDatePickerOpen = false;
  viewMode: ViewMode = 'monthly';
  selectedCategoryId: number | null = null;
  
  weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  calendarDays: CalendarDay[] = [];
  categories: Category[] = [];
  
  selectedCategoryIndex = 0;
  selectedViewIndex = 1; // 월간이 기본

  selectedYear!: number;
  selectedMonth!: number;
  tempSelectedYear!: number;
  tempSelectedMonth!: number;
  availableYears: number[] = [];
  visibleYears: number[] = [];
  yearScrollOffset = 0;
  availableMonths = [
    { value: 0, label: '1월' },
    { value: 1, label: '2월' },
    { value: 2, label: '3월' },
    { value: 3, label: '4월' },
    { value: 4, label: '5월' },
    { value: 5, label: '6월' },
    { value: 6, label: '7월' },
    { value: 7, label: '8월' },
    { value: 8, label: '9월' },
    { value: 9, label: '10월' },
    { value: 10, label: '11월' },
    { value: 11, label: '12월' }
  ];

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeDateSelectors();
  }

  initializeDateSelectors(): void {
    const currentYear = new Date().getFullYear();
    // 현재 년도 기준으로 앞뒤 50년씩
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      this.availableYears.push(i);
    }
    this.selectedYear = this.currentDate.getFullYear();
    this.selectedMonth = this.currentDate.getMonth();
    this.tempSelectedYear = this.selectedYear;
    this.tempSelectedMonth = this.selectedMonth;
    this.updateVisibleYears();
    this.updateFormattedDate();
  }

  updateVisibleYears(): void {
    const currentIndex = this.availableYears.indexOf(this.tempSelectedYear);
    // 현재 선택된 연도 기준으로 앞뒤 3년씩만 표시 (총 7개)
    const startIndex = Math.max(0, currentIndex - 3);
    const endIndex = Math.min(this.availableYears.length, currentIndex + 4);
    this.visibleYears = this.availableYears.slice(startIndex, endIndex);
  }

  updateFormattedDate(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    this.formattedDate = `${year}.${month.toString().padStart(2, '0')}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isDatePickerOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && (
      target.closest('.date-picker-popover') ||
      target.closest('.date-picker-select-panel') ||
      target.closest('.month-year-selector') ||
      target.closest('.mat-mdc-select') || // 셀렉트 트리거 영역
      target.closest('.mat-mdc-select-panel') || // 셀렉트 옵션 패널
      target.closest('.mat-mdc-select-trigger') || // 트리거 내부 클릭
      target.closest('.mat-mdc-form-field') || // 폼 필드 영역
      target.closest('.mat-mdc-select-value') // 셀렉트 값 영역
    )) {
      return;
    }

    this.isDatePickerOpen = false;
  }

  toggleDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.isDatePickerOpen) {
      this.closeDatePicker();
    } else {
      this.tempSelectedYear = this.selectedYear;
      this.tempSelectedMonth = this.selectedMonth;
      this.updateVisibleYears();
      setTimeout(() => {
        this.isDatePickerOpen = true;
      }, 0);
    }
  }

  closeDatePicker(): void {
    this.isDatePickerOpen = false;
  }

  selectYear(year: number): void {
    this.tempSelectedYear = year;
    this.updateVisibleYears();
  }

  selectMonth(monthIndex: number): void {
    this.tempSelectedMonth = monthIndex;
  }

  scrollYears(direction: number): void {
    const currentIndex = this.availableYears.indexOf(this.tempSelectedYear);
    const newIndex = Math.max(0, Math.min(this.availableYears.length - 1, currentIndex + direction));
    this.tempSelectedYear = this.availableYears[newIndex];
    this.updateVisibleYears();
  }

  goToToday(): void {
    const today = new Date();
    this.tempSelectedYear = today.getFullYear();
    this.tempSelectedMonth = today.getMonth();
    this.updateVisibleYears();
  }

  applyDateSelection(): void {
    this.selectedYear = this.tempSelectedYear;
    this.selectedMonth = this.tempSelectedMonth;
    const newDate = new Date(this.selectedYear, this.selectedMonth, 1);
    this.currentDate = new Date(newDate);
    this.updateFormattedDate();
    this.generateCalendar();
    this.cdr.detectChanges();
    this.dateChange.emit(new Date(this.currentDate));
    this.closeDatePicker();
  }

  ngOnInit(): void {
    this.updateFormattedDate();
    this.loadCategories();
    this.generateCalendar();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('카테고리 로드 실패:', err);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      this.generateCalendar();
    }
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    // 배열을 새로 생성하여 변경 감지 강제
    const newCalendarDays: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      const dayDate = new Date(currentDate);
      dayDate.setHours(0, 0, 0, 0);
      
      const dayOfWeek = currentDate.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isHoliday = this.isHoliday(dayDate);
      
      const dayTransactions = this.getTransactionsForDate(dayDate);
      
      newCalendarDays.push({
        date: new Date(dayDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        isSunday: isSunday,
        isSaturday: isSaturday,
        isHoliday: isHoliday,
        transactions: dayTransactions
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.calendarDays = newCalendarDays;
  }

  /**
   * 한국의 공휴일인지 확인하는 함수
   * 양력 고정 공휴일만 처리 (음력 공휴일은 추후 확장 가능)
   */
  isHoliday(date: Date): boolean {
    // 기본: 고정 공휴일
    if (this.isFixedHoliday(date)) {
      return true;
    }

    // 대체 공휴일: 공휴일이 일요일과 겹친 경우 다음 월요일을 공휴일 처리
    const isMonday = date.getDay() === 1;
    if (isMonday) {
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday.getDay() === 0 && this.isFixedHoliday(yesterday)) {
        return true;
      }
    }
    
    return false;
  }

  // 고정 공휴일 판별 함수 (대체휴일 계산에 사용)
  private isFixedHoliday(date: Date): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const fixedHolidays: { month: number; day: number }[] = [
      { month: 1, day: 1 },
      { month: 3, day: 1 },
      { month: 5, day: 5 },
      { month: 6, day: 6 },
      { month: 8, day: 15 },
      { month: 10, day: 3 },
      { month: 10, day: 9 },
      { month: 12, day: 25 }
    ];
    return fixedHolidays.some(h => h.month === month && h.day === day);
  }

  getTransactionsForDate(date: Date): Transaction[] {
    return this.transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      transactionDate.setHours(0, 0, 0, 0);
      const dateMatch = transactionDate.getTime() === date.getTime();
      
      if (!dateMatch) return false;
      
      if (this.selectedCategoryId === null) {
        return true;
      }
      
      return t.categoryId === this.selectedCategoryId;
    });
  }

  getTransactionDisplayText(transaction: Transaction): string {
    if (transaction.memo && transaction.memo.length > 0) {
      return transaction.memo.length > 10 
        ? transaction.memo.substring(0, 10) + '...' 
        : transaction.memo;
    }
    return transaction.categoryName;
  }

  formatAmount(amount: number, type: string): string {
    const formatted = new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
    return type === 'INCOME' ? `+${formatted}` : `-${formatted}`;
  }

  previousPeriod(): void {
    if (this.viewMode === 'monthly') {
      const newDate = new Date(this.currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      this.currentDate = new Date(newDate);
      this.selectedYear = this.currentDate.getFullYear();
      this.selectedMonth = this.currentDate.getMonth();
      this.tempSelectedYear = this.selectedYear;
      this.tempSelectedMonth = this.selectedMonth;
      this.updateVisibleYears();
      this.updateFormattedDate();
      this.generateCalendar();
      this.cdr.detectChanges();
      this.dateChange.emit(new Date(this.currentDate));
    }
  }

  nextPeriod(): void {
    if (this.viewMode === 'monthly') {
      const newDate = new Date(this.currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      this.currentDate = new Date(newDate);
      this.selectedYear = this.currentDate.getFullYear();
      this.selectedMonth = this.currentDate.getMonth();
      this.tempSelectedYear = this.selectedYear;
      this.tempSelectedMonth = this.selectedMonth;
      this.updateVisibleYears();
      this.updateFormattedDate();
      this.generateCalendar();
      this.cdr.detectChanges();
      this.dateChange.emit(new Date(this.currentDate));
    }
  }

  onDayClick(day: CalendarDay): void {
    this.dayClick.emit(day);
  }

  onCategoryChange(index: number): void {
    if (index === 0) {
      this.selectedCategoryId = null;
    } else {
      this.selectedCategoryId = this.categories[index - 1].id;
    }
    this.generateCalendar();
  }

  onViewChange(index: number): void {
    const views: ViewMode[] = ['weekly', 'monthly', 'yearly'];
    this.viewMode = views[index];
    // 주간/연간 뷰는 추후 구현
    if (this.viewMode === 'monthly') {
      this.generateCalendar();
    }
  }
}
