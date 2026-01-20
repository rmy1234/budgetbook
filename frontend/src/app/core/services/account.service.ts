import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Account {
  id: number;
  userId: number;
  bankName: string;
  alias: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountCreateRequest {
  bankName: string;
  alias: string;
  balance?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/accounts`;
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  public accounts$ = this.accountsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAccounts(bankName?: string): Observable<Account[]> {
    let params = new HttpParams();
    if (bankName) {
      params = params.set('bankName', bankName);
    }

    return this.http.get<{ data: Account[] }>(this.apiUrl, { params })
      .pipe(
        map(response => response.data),
        tap(accounts => this.accountsSubject.next(accounts))
      );
  }

  createAccount(request: AccountCreateRequest): Observable<Account> {
    return this.http.post<{ data: Account }>(this.apiUrl, request)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshAccounts())
      );
  }

  updateAccount(id: number, alias: string): Observable<Account> {
    return this.http.put<{ data: Account }>(`${this.apiUrl}/${id}`, { alias })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshAccounts())
      );
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => this.refreshAccounts())
      );
  }

  private refreshAccounts(): void {
    this.http.get<{ data: Account[] }>(this.apiUrl)
      .pipe(
        map(response => response.data)
      )
      .subscribe({
        next: (accounts) => {
          this.accountsSubject.next(accounts);
        },
        error: (error) => {
          console.error('계좌 목록 새로고침 실패:', error);
        }
      });
  }

  // 거래 등록/수정/삭제 후 계좌 잔액을 실시간으로 업데이트하기 위한 메소드
  refreshAccountsBalance(): void {
    this.refreshAccounts();
  }

  // 강제로 계좌 목록을 다시 로드하는 메소드 (캐시 무시)
  forceRefreshAccounts(): Observable<Account[]> {
    return this.http.get<{ data: Account[] }>(this.apiUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .pipe(
        map(response => response.data),
        tap(accounts => this.accountsSubject.next(accounts))
      );
  }
}
