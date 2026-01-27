import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from '../../../core/services/account.service';
import { AccountData } from '../../../core/services/ai.service';

export interface AccountConfirmDialogData {
  account: AccountData;
}

@Component({
  selector: 'app-account-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './account-confirm-dialog.component.html',
  styleUrls: ['./account-confirm-dialog.component.scss']
})
export class AccountConfirmDialogComponent {
  accountForm: FormGroup;
  loading = false;

  bankOptions = [
    '국민은행',
    '신한은행',
    '우리은행',
    '하나은행',
    '농협은행',
    'IBK기업은행',
    'SC제일은행',
    '한국시티은행',
    '카카오뱅크',
    '케이뱅크',
    '토스뱅크',
    '새마을금고',
    '신협',
    '우체국',
    '기타'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AccountConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountConfirmDialogData,
    private accountService: AccountService
  ) {
    this.accountForm = this.fb.group({
      bankName: [data.account.bankName, Validators.required],
      alias: [data.account.alias, [Validators.required, Validators.minLength(1)]],
      balance: [this.formatNumber(data.account.balance), [Validators.required]]
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('ko-KR');
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

  onSave(): void {
    if (this.accountForm.valid && !this.loading) {
      this.loading = true;
      const formValue = this.accountForm.value;

      this.accountService.createAccount({
        bankName: formValue.bankName,
        alias: formValue.alias,
        balance: this.getBalanceValue()
      }).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('계좌 등록 실패:', err);
          alert(err.error?.message || '계좌 등록에 실패했습니다.');
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
