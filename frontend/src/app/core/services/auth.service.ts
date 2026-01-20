import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  age: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  signup(request: SignupRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, request);
  }

  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(response => response.data),
      tap(token => {
        if (token?.accessToken) {
          localStorage.setItem('accessToken', token.accessToken);
          localStorage.setItem('refreshToken', token.refreshToken);
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private loadUserFromStorage(): void {
    // 로그인 시 사용자 정보 로드
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('리프레시 토큰이 없습니다'));
    }

    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/refresh`, {
      refreshToken: refreshToken
    }).pipe(
      map(response => response.data),
      tap(token => {
        if (token?.accessToken) {
          localStorage.setItem('accessToken', token.accessToken);
          // 리프레시 토큰도 업데이트 (서버에서 새로 발급할 수 있음)
          if (token.refreshToken) {
            localStorage.setItem('refreshToken', token.refreshToken);
          }
        } else {
          // 토큰 갱신 실패 시 로그아웃
          this.logout();
        }
      }),
      catchError(error => {
        // 리프레시 토큰도 만료된 경우 로그아웃
        this.logout();
        return throwError(() => error);
      })
    );
  }
}
