# 프론트엔드 프로젝트 구조

## 6️⃣ Angular 프로젝트 구조 및 주요 컴포넌트

### 프로젝트 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts           # 루트 컴포넌트
│   │   ├── app.routes.ts              # 라우팅 설정
│   │   ├── core/                      # 핵심 모듈
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts      # 인증 가드
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts # JWT 인터셉터
│   │   │   └── services/
│   │   │       └── auth.service.ts    # 인증 서비스
│   │   └── features/                  # 기능 모듈
│   │       ├── auth/                  # 인증
│   │       │   ├── auth.routes.ts
│   │       │   ├── login/
│   │       │   │   └── login.component.ts
│   │       │   └── signup/
│   │       │       └── signup.component.ts
│   │       └── dashboard/             # 대시보드
│   │           ├── dashboard.routes.ts
│   │           ├── dashboard-layout/
│   │           │   └── dashboard-layout.component.ts
│   │           ├── home/
│   │           │   └── home.component.ts
│   │           ├── transactions/
│   │           │   └── transactions.component.ts
│   │           ├── accounts/
│   │           │   └── accounts.component.ts
│   │           └── statistics/
│   │               └── statistics.component.ts
│   ├── assets/                        # 정적 파일
│   ├── environments/                  # 환경 설정
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts                        # 앱 진입점
│   └── styles.scss                    # 전역 스타일
├── angular.json
├── package.json
├── tsconfig.json
├── Dockerfile
└── nginx.conf
```

### 주요 컴포넌트

#### 1. Core 모듈

**AuthService**
- 로그인/회원가입 처리
- JWT 토큰 관리 (LocalStorage)
- 인증 상태 관리

**AuthGuard**
- 보호된 라우트 접근 제어
- 미인증 시 로그인 페이지로 리다이렉트

**AuthInterceptor**
- 모든 HTTP 요청에 JWT 토큰 자동 추가
- Authorization 헤더 설정

#### 2. Auth 모듈

**LoginComponent**
- 이메일/비밀번호 로그인
- Angular Material UI
- Reactive Forms 검증

**SignupComponent**
- 회원가입 폼
- 입력값 검증
- API 연동

#### 3. Dashboard 모듈

**DashboardLayoutComponent**
- 사이드바 네비게이션
- 메인 레이아웃
- 로그아웃 기능

**HomeComponent**
- 대시보드 홈
- 빠른 접근 카드

**TransactionsComponent**
- 거래 내역 관리 (구현 예정)

**AccountsComponent**
- 계좌 관리 (구현 예정)

**StatisticsComponent**
- 통계 분석 (구현 예정)

### 기술 스택

- **Angular 17**: 최신 LTS 버전
- **Angular Material**: UI 컴포넌트 라이브러리
- **RxJS**: 반응형 프로그래밍
- **Standalone Components**: 모듈 없이 컴포넌트 사용
- **Reactive Forms**: 폼 관리

### 라우팅 구조

```
/ (대시보드)
├── /transactions (거래 내역)
├── /accounts (계좌 관리)
└── /statistics (통계)

/auth
├── /login (로그인)
└── /signup (회원가입)
```

### 상태 관리

- **BehaviorSubject**: 현재 사용자 정보
- **LocalStorage**: JWT 토큰 저장
- **Observable**: 비동기 데이터 스트림
