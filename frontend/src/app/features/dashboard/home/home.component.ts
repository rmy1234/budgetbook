import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CalendarComponent, CalendarDay } from '../calendar/calendar.component';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';
import { DayTransactionsDialogComponent } from '../day-transactions-dialog/day-transactions-dialog.component';
import { TransactionService, Transaction } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CalendarComponent, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  loading = true;
  private subscriptions = new Subscription();

  constructor(
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 토큰 확인
    if (!this.authService.isAuthenticated()) {
      console.warn('인증 토큰이 없습니다. 로그인 페이지로 이동합니다.');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadTransactions(date?: Date): void {
    this.loading = true;
    const targetDate = date || new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // 월별 거래 내역을 가져오기 위해 페이지네이션으로 조회
    const sub = this.transactionService.getTransactions(undefined, 0, 1000).subscribe({
      next: (page) => {
        // 해당 월의 거래 내역만 필터링
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        this.transactions = page.content.filter(t => {
          const transactionDate = new Date(t.transactionDate);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('거래 내역 로드 실패:', err);
        this.loading = false;
        // 401 오류인 경우 로그인 페이지로 리다이렉트
        if (err.status === 401) {
          console.warn('인증 토큰이 만료되었거나 없습니다. 로그인 페이지로 이동합니다.');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
    });
    
    this.subscriptions.add(sub);
  }

  onDateChange(date: Date): void {
    this.loadTransactions(date);
  }

  onDayClick(day: CalendarDay): void {
    const dialogRef = this.dialog.open(DayTransactionsDialogComponent, {
      width: '700px',
      autoFocus: false,
      data: {
        date: day.date,
        transactions: day.transactions
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'add') {
        const addDialog = this.dialog.open(TransactionDialogComponent, {
          width: '500px',
          data: {
            date: day.date
          }
        });

        addDialog.afterClosed().subscribe(addResult => {
          if (addResult) {
            this.loadTransactions();
          }
        });
      } else if (result === 'refresh') {
        this.loadTransactions();
      }
    });
  }
}
