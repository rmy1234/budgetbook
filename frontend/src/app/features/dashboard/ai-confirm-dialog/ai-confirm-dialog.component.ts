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
import { MatChipsModule } from '@angular/material/chips';
import { TransactionService, TransactionCreateRequest } from '../../../core/services/transaction.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AccountService, Account } from '../../../core/services/account.service';
import { AiParseResponse } from '../../../core/services/ai.service';

export interface AiConfirmDialogData {
  parseResult: AiParseResponse;
}

@Component({
  selector: 'app-ai-confirm-dialog',
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
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './ai-confirm-dialog.component.html',
  styleUrls: ['./ai-confirm-dialog.component.scss']
})
export class AiConfirmDialogComponent implements OnInit {
  transactionForm: FormGroup;
  accounts: Account[] = [];
  categories: Category[] = [];
  filteredCategories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AiConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AiConfirmDialogData,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private accountService: AccountService
  ) {
    const parseResult = data.parseResult;
    
    this.transactionForm = this.fb.group({
      type: [parseResult.type, Validators.required],
      accountId: [null, Validators.required],
      categoryId: [parseResult.categoryId, Validators.required],
      amount: [parseResult.amount?.toLocaleString('ko-KR') || '', [Validators.required, this.amountValidator.bind(this)]],
      memo: [parseResult.memo || ''],
      transactionDate: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadCategories();
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
        this.filterCategories();
        
        // AI가 카테고리 ID를 찾지 못한 경우, 이름으로 매칭 시도
        if (!this.data.parseResult.categoryId && this.data.parseResult.categoryName) {
          const type = this.transactionForm.get('type')?.value;
          const matched = categories.find(
            c => c.name === this.data.parseResult.categoryName && c.type === type
          );
          if (matched) {
            this.transactionForm.patchValue({ categoryId: matched.id });
          }
        }
      },
      error: (err) => console.error('카테고리 로드 실패:', err)
    });
  }

  filterCategories(): void {
    const type = this.transactionForm.get('type')?.value;
    this.filteredCategories = this.categories.filter(c => c.type === type);
  }

  onTypeChange(): void {
    this.filterCategories();
    // 타입 변경 시 해당 타입의 첫 번째 카테고리 선택
    if (this.filteredCategories.length > 0) {
      this.transactionForm.patchValue({ categoryId: this.filteredCategories[0].id });
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

  onSave(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transactionDate = new Date(formValue.transactionDate);
      transactionDate.setHours(12, 0, 0, 0);

      const request: TransactionCreateRequest = {
        accountId: formValue.accountId,
        type: formValue.type,
        categoryId: formValue.categoryId,
        amount: this.getAmountValue(),
        memo: formValue.memo || undefined,
        transactionDate: transactionDate.toISOString()
      };

      this.transactionService.createTransaction(request).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('거래 내역 생성 실패:', err)
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
