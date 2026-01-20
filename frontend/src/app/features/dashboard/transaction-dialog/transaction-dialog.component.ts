import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService, TransactionCreateRequest } from '../../../core/services/transaction.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AccountService, Account } from '../../../core/services/account.service';
import { CalendarDay } from '../calendar/calendar.component';

export interface TransactionDialogData {
  date: Date;
  transaction?: any;
}

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.scss']
})
export class TransactionDialogComponent implements OnInit {
  transactionForm: FormGroup;
  accounts: Account[] = [];
  categories: Category[] = [];
  filteredCategories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TransactionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionDialogData,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private accountService: AccountService
  ) {
    this.transactionForm = this.fb.group({
      type: ['EXPENSE', Validators.required],
      accountId: [null, Validators.required],
      categoryId: [null, Validators.required],
      amount: ['', [Validators.required, this.amountValidator.bind(this)]],
      memo: [''],
      transactionDate: [data.date, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadCategories();
    this.onTypeChange();

    if (this.data.transaction) {
      const formattedAmount = this.data.transaction.amount ? 
        Number(this.data.transaction.amount).toLocaleString('ko-KR') : '';
      this.transactionForm.patchValue({
        type: this.data.transaction.type,
        accountId: this.data.transaction.accountId,
        categoryId: this.data.transaction.categoryId,
        amount: formattedAmount,
        memo: this.data.transaction.memo || '',
        transactionDate: new Date(this.data.transaction.transactionDate)
      });
    }
  }

  onAmountInput(event: any): void {
    const input = event.target.value;
    const numericValue = input.replace(/,/g, '');
    if (numericValue === '' || !isNaN(Number(numericValue))) {
      const formatted = numericValue === '' ? '' : Number(numericValue).toLocaleString('ko-KR');
      this.transactionForm.get('amount')?.setValue(formatted, { emitEvent: false });
    }
  }

  getAmountValue(): number {
    const amountValue = this.transactionForm.get('amount')?.value;
    if (!amountValue) return 0;
    const numericValue = String(amountValue).replace(/,/g, '');
    return Number(numericValue) || 0;
  }

  amountValidator(control: any) {
    if (!control.value) {
      return { required: true };
    }
    const numericValue = String(control.value).replace(/,/g, '');
    const num = Number(numericValue);
    if (isNaN(num) || num < 1) {
      return { min: true };
    }
    return null;
  }

  loadAccounts(): void {
    this.accountService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        if (accounts.length > 0 && !this.transactionForm.get('accountId')?.value) {
          this.transactionForm.patchValue({ accountId: accounts[0].id });
        }
      },
      error: (err) => console.error('계좌 로드 실패:', err)
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.onTypeChange();
      },
      error: (err) => console.error('카테고리 로드 실패:', err)
    });
  }

  onTypeChange(): void {
    const type = this.transactionForm.get('type')?.value;
    this.filteredCategories = this.categories.filter(c => c.type === type);
    
    if (this.filteredCategories.length > 0 && !this.transactionForm.get('categoryId')?.value) {
      this.transactionForm.patchValue({ categoryId: this.filteredCategories[0].id });
    }
  }

  onSave(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transactionDate = new Date(formValue.transactionDate);
      transactionDate.setHours(12, 0, 0, 0);

      // 콤마 제거한 숫자 값으로 변환
      const amountValue = this.getAmountValue();

      const request: TransactionCreateRequest = {
        accountId: formValue.accountId,
        type: formValue.type,
        categoryId: formValue.categoryId,
        amount: amountValue,
        memo: formValue.memo || undefined,
        transactionDate: transactionDate.toISOString()
      };

      if (this.data.transaction) {
        this.transactionService.updateTransaction(this.data.transaction.id, request).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('거래 내역 수정 실패:', err)
        });
      } else {
        this.transactionService.createTransaction(request).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('거래 내역 생성 실패:', err)
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
