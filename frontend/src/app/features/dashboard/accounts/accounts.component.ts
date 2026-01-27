import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AccountService, Account } from '../../../core/services/account.service';
import { Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit, OnDestroy {
  accounts: Account[] = [];
  displayedColumns: string[] = ['bankName', 'alias', 'balance', 'actions'];
  accountForm: FormGroup;
  isEditing = false;
  editingAccountId: number | null = null;
  private subscription = new Subscription();

  constructor(
    private accountService: AccountService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.accountForm = this.fb.group({
      bankName: ['', [Validators.required]],
      alias: [''],
      balance: ['0', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 페이지 진입 시 강제로 최신 데이터 가져오기
    this.loadAccounts();
    // 계좌 상태 실시간 구독
    this.subscription.add(
      this.accountService.accounts$.subscribe(accounts => {
        if (accounts) {
          this.accounts = accounts;
        }
      })
    );
    // 라우터 네비게이션 이벤트 구독 (계좌 관리 페이지 진입 시마다 최신 데이터 로드)
    this.subscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        if (event.url === '/accounts' || event.urlAfterRedirects === '/accounts') {
          this.loadAccounts();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAccounts(): void {
    // 강제로 최신 데이터 가져오기 (캐시 무시)
    this.accountService.forceRefreshAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
      },
      error: (error) => {
        console.error('계좌 목록 로드 실패:', error);
        this.snackBar.open('계좌 목록을 불러오는데 실패했습니다', '닫기', { duration: 3000 });
      }
    });
  }

  onBalanceInput(event: any): void {
    const input = event.target.value;
    const numericValue = input.replace(/,/g, '');
    if (numericValue === '' || !isNaN(Number(numericValue))) {
      const formatted = numericValue === '' ? '0' : Number(numericValue).toLocaleString('ko-KR');
      this.accountForm.get('balance')?.setValue(formatted, { emitEvent: false });
    }
  }

  getBalanceValue(): number {
    const balanceValue = this.accountForm.get('balance')?.value;
    if (!balanceValue) return 0;
    const numericValue = String(balanceValue).replace(/,/g, '');
    return Number(numericValue) || 0;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('ko-KR');
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      const formValue = this.accountForm.value;
      const request = {
        bankName: formValue.bankName,
        alias: formValue.alias || null,
        balance: this.getBalanceValue()
      };

      if (this.isEditing && this.editingAccountId) {
        // 수정은 별칭과 잔액 가능
        this.accountService.updateAccount(
          this.editingAccountId, 
          request.alias || '', 
          request.balance
        ).subscribe({
          next: () => {
            this.snackBar.open('계좌가 수정되었습니다', '닫기', { duration: 3000 });
            this.resetForm();
          },
          error: (error) => {
            this.snackBar.open('계좌 수정에 실패했습니다', '닫기', { duration: 3000 });
          }
        });
      } else {
        this.accountService.createAccount(request).subscribe({
          next: () => {
            this.snackBar.open('계좌가 생성되었습니다', '닫기', { duration: 3000 });
            this.resetForm();
          },
          error: (error) => {
            this.snackBar.open('계좌 생성에 실패했습니다', '닫기', { duration: 3000 });
          }
        });
      }
    }
  }

  editAccount(account: Account): void {
    this.isEditing = true;
    this.editingAccountId = account.id;
    this.accountForm.patchValue({
      bankName: account.bankName,
      alias: account.alias || '',
      balance: this.formatNumber(account.balance)
    });
  }

  deleteAccount(account: Account): void {
    if (confirm(`정말로 "${account.bankName}" 계좌를 삭제하시겠습니까?`)) {
      this.accountService.deleteAccount(account.id).subscribe({
        next: () => {
          this.snackBar.open('계좌가 삭제되었습니다', '닫기', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('계좌 삭제에 실패했습니다', '닫기', { duration: 3000 });
        }
      });
    }
  }

  resetForm(): void {
    this.accountForm.reset({
      bankName: '',
      alias: '',
      balance: '0'
    });
    this.isEditing = false;
    this.editingAccountId = null;
  }

  formatBalance(balance: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(balance);
  }
}
