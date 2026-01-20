import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AccountService } from './account.service';

export interface Transaction {
  id: number;
  accountId: number;
  accountAlias: string;
  accountBankName: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: number;
  categoryName: string;
  memo?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreateRequest {
  accountId: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: number;
  memo?: string;
  transactionDate: string;
}

export interface TransactionPage {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(
    private http: HttpClient,
    private accountService: AccountService
  ) {}

  getTransactions(accountId?: number, page: number = 0, size: number = 20): Observable<TransactionPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (accountId) {
      params = params.set('accountId', accountId.toString());
    }

    return this.http.get<{ data: TransactionPage }>(this.apiUrl, { params })
      .pipe(
        map(response => response.data)
      );
  }

  getTransactionsByDate(date: string, accountId?: number): Observable<Transaction[]> {
    let params = new HttpParams().set('date', date);
    // accountId가 명시적으로 전달된 경우 (0도 유효한 ID일 수 있으므로 undefined/null만 체크)
    if (accountId !== undefined && accountId !== null) {
      params = params.set('accountId', accountId.toString());
      console.log('계좌 필터 적용 - accountId:', accountId, '타입:', typeof accountId);
    } else {
      console.log('계좌 필터 없음 - accountId:', accountId);
    }
    const paramString = params.toString();
    console.log('요청 파라미터:', paramString);
    console.log('전체 URL:', `${this.apiUrl}?${paramString}`);
    return this.http.get<{ data: Transaction[] }>(this.apiUrl, { params })
      .pipe(
        map(response => response.data)
      );
  }

  createTransaction(request: TransactionCreateRequest): Observable<Transaction> {
    return this.http.post<{ data: Transaction }>(this.apiUrl, request)
      .pipe(
        map(response => response.data),
        tap(() => {
          // 거래 완료 후 강제로 계좌 목록 새로고침
          setTimeout(() => {
            this.accountService.forceRefreshAccounts().subscribe();
          }, 100);
        })
      );
  }

  updateTransaction(id: number, request: Partial<TransactionCreateRequest>): Observable<Transaction> {
    return this.http.put<{ data: Transaction }>(`${this.apiUrl}/${id}`, request)
      .pipe(
        map(response => response.data),
        tap(() => {
          // 거래 수정 후 강제로 계좌 목록 새로고침
          setTimeout(() => {
            this.accountService.forceRefreshAccounts().subscribe();
          }, 100);
        })
      );
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          // 거래 삭제 후 강제로 계좌 목록 새로고침
          setTimeout(() => {
            this.accountService.forceRefreshAccounts().subscribe();
          }, 100);
        })
      );
  }
}
