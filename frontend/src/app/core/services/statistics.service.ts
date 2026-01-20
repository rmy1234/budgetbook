import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface WeeklyExpense {
  week: number;
  startDate: string;
  endDate: string;
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlyStatistics {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryExpenses: CategoryExpense[];
  categoryIncomes: CategoryExpense[];
  weeklyExpenses: WeeklyExpense[];
}

export interface DailyExpense {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface WeeklyStatistics {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  dailyExpenses: DailyExpense[];
  categoryExpenses: CategoryExpense[];
  categoryIncomes: CategoryExpense[];
}

export interface MonthlyExpense {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface YearlyStatistics {
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyExpenses: MonthlyExpense[];
  categoryExpenses: CategoryExpense[];
  categoryIncomes: CategoryExpense[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) {}

  getMonthlyStatistics(year: number, month: number): Observable<MonthlyStatistics> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<{ data: MonthlyStatistics }>(`${this.apiUrl}/monthly`, { params })
      .pipe(
        map(response => response.data)
      );
  }

  getWeeklyStatistics(year: number, week: number): Observable<WeeklyStatistics> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('week', week.toString());

    return this.http.get<{ data: WeeklyStatistics }>(`${this.apiUrl}/weekly`, { params })
      .pipe(
        map(response => response.data)
      );
  }

  getYearlyStatistics(year: number): Observable<YearlyStatistics> {
    const params = new HttpParams()
      .set('year', year.toString());

    return this.http.get<{ data: YearlyStatistics }>(`${this.apiUrl}/yearly`, { params })
      .pipe(
        map(response => response.data)
      );
  }
}
