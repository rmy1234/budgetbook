import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Transaction, TransactionService } from '../../../core/services/transaction.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

export interface DayTransactionsDialogData {
  date: Date;
  transactions: Transaction[];
}

@Component({
  selector: 'app-day-transactions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './day-transactions-dialog.component.html',
  styleUrls: ['./day-transactions-dialog.component.scss']
})
export class DayTransactionsDialogComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<DayTransactionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DayTransactionsDialogData,
    private dialog: MatDialog,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  addTransaction(): void {
    this.dialogRef.close('add');
  }

  editTransaction(transaction: Transaction): void {
    const editDialog = this.dialog.open(TransactionDialogComponent, {
      width: '500px',
      data: {
        date: this.data.date,
        transaction: transaction
      }
    });

    editDialog.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close('refresh');
      }
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`정말로 이 거래 내역을 삭제하시겠습니까?`)) {
      this.transactionService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          this.snackBar.open('거래 내역이 삭제되었습니다', '닫기', { duration: 3000 });
          this.dialogRef.close('refresh');
        },
        error: (err) => {
          this.snackBar.open('거래 내역 삭제에 실패했습니다', '닫기', { duration: 3000 });
        }
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
