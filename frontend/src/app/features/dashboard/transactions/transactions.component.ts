import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { TransactionService, Transaction, TransactionPage } from '../../../core/services/transaction.service';
import { AccountService, Account } from '../../../core/services/account.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatPaginatorModule
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  displayedColumns: string[] = ['date', 'type', 'account', 'category', 'amount', 'memo', 'actions'];
  filterForm: FormGroup;
  pageSize = 20;
  pageIndex = 0;
  totalElements = 0;
  selectedDate: Date | null = null;
  private subscriptions = new Subscription();

  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectedDate = today;
    this.filterForm = this.fb.group({
      accountId: [null],
      date: [today]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadTransactions();
    
    // 거래 변경 이벤트 구독
    const changeSub = this.transactionService.transactionChanged$.subscribe(() => {
      this.loadTransactions();
    });
    this.subscriptions.add(changeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadAccounts(): void {
    this.accountService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
      },
      error: (err) => {
        console.error('계좌 로드 실패:', err);
      }
    });
  }

  loadTransactions(): void {
    const formValue = this.filterForm.value;

    // accountId가 null이 아니고 유효한 숫자인 경우에만 사용
    const accountId = (formValue.accountId !== null && formValue.accountId !== undefined && formValue.accountId !== '')
      ? Number(formValue.accountId)
      : undefined;

    if (formValue.date) {
      // 날짜별 조회 (계좌 필터 포함)
      const dateStr = this.formatDate(formValue.date);
      this.transactionService.getTransactionsByDate(dateStr, accountId).subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.totalElements = transactions.length;
        },
        error: (err) => {
          console.error('거래 내역 로드 실패:', err);
          this.snackBar.open('거래 내역을 불러오는데 실패했습니다', '닫기', { duration: 3000 });
        }
      });
    } else {
      // 페이지네이션 조회
      this.transactionService.getTransactions(accountId, this.pageIndex, this.pageSize).subscribe({
        next: (page: TransactionPage) => {
          this.transactions = page.content;
          this.totalElements = page.totalElements;
        },
        error: (err) => {
          console.error('거래 내역 로드 실패:', err);
          this.snackBar.open('거래 내역을 불러오는데 실패했습니다', '닫기', { duration: 3000 });
        }
      });
    }
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    // accountId가 문자열로 전달될 수 있으므로 명시적으로 처리
    const currentAccountId = this.filterForm.get('accountId')?.value;
    if (currentAccountId !== null && currentAccountId !== undefined) {
      // 문자열이면 숫자로 변환
      this.filterForm.patchValue({ accountId: Number(currentAccountId) }, { emitEvent: false });
    }
    this.loadTransactions();
  }

  onDateChange(date: Date | null): void {
    this.selectedDate = date;
    this.filterForm.patchValue({ date });
    this.onFilterChange();
  }

  resetFilters(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectedDate = today;
    this.filterForm.patchValue({
      accountId: null,
      date: today
    });
    this.onFilterChange();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransactions();
  }

  editTransaction(transaction: Transaction): void {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      width: '500px',
      data: {
        date: new Date(transaction.transactionDate),
        transaction: transaction
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransactions();
      }
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`정말로 이 거래 내역을 삭제하시겠습니까?`)) {
      this.transactionService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          this.snackBar.open('거래 내역이 삭제되었습니다', '닫기', { duration: 3000 });
          this.loadTransactions();
        },
        error: (err) => {
          this.snackBar.open('거래 내역 삭제에 실패했습니다', '닫기', { duration: 3000 });
        }
      });
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatAmount(amount: number, type: string): string {
    const formatted = new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
    return type === 'INCOME' ? `+${formatted}` : `-${formatted}`;
  }

  getTypeColor(type: string): string {
    return type === 'INCOME' ? 'income' : 'expense';
  }
}
