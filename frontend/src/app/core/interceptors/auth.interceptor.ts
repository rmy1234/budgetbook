import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SecurityService } from '../services/security.service';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

// 토큰 갱신 중 플래그 (중복 갱신 방지)
let isRefreshing = false;
let refreshTokenSubject: Observable<HttpEvent<unknown>> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const securityService = inject(SecurityService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  // 보안접속이 활성화된 경우 HTTPS URL 사용
  if (securityService.isSecureConnectionEnabled()) {
    const secureUrl = securityService.getSecureApiUrl(req.url);
    if (secureUrl !== req.url) {
      req = req.clone({
        url: secureUrl
      });
    }
  }

  // 인증이 필요한 요청인지 확인 (로그인/회원가입, 리프레시 제외)
  const isAuthRequired = !req.url.includes('/auth/login') 
    && !req.url.includes('/auth/signup')
    && !req.url.includes('/auth/refresh');
  
  if (isAuthRequired && token) {
    // 토큰이 있으면 Authorization 헤더 추가
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 에러이고 인증이 필요한 요청인 경우
      if (error.status === 401 && isAuthRequired) {
        return handle401Error(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  // 이미 토큰 갱신 중이면 대기
  if (isRefreshing && refreshTokenSubject) {
    return refreshTokenSubject.pipe(
      switchMap(() => {
        const newToken = authService.getAccessToken();
        if (newToken) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            }
          });
          return next(req);
        }
        // 토큰 갱신 실패 시 로그아웃
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => new Error('토큰 갱신 실패'));
      })
    );
  }

  // 토큰 갱신 시작
  isRefreshing = true;
  refreshTokenSubject = authService.refreshToken().pipe(
    switchMap((tokenResponse) => {
      isRefreshing = false;
      refreshTokenSubject = null;
      
      // 새로운 토큰으로 원래 요청 재시도
      const newToken = authService.getAccessToken();
      if (newToken) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });
        return next(req);
      }
      
      // 토큰 갱신 실패 시 로그아웃
      authService.logout();
      router.navigate(['/auth/login']);
      return throwError(() => new Error('토큰 갱신 실패'));
    }),
    catchError((error) => {
      // 리프레시 토큰도 만료된 경우
      isRefreshing = false;
      refreshTokenSubject = null;
      authService.logout();
      router.navigate(['/auth/login']);
      return throwError(() => error);
    })
  );

  return refreshTokenSubject;
}
