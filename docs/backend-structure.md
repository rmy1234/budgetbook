# 백엔드 패키지 구조

## 2️⃣ 백엔드 패키지 구조 및 주요 클래스

### 프로젝트 구조

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/budgetbook/
│   │   │   ├── BudgetBookApplication.java
│   │   │   ├── config/                    # 설정 클래스
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── RedisConfig.java
│   │   │   ├── domain/                    # 도메인 레이어
│   │   │   │   ├── user/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── UserRole.java
│   │   │   │   │   └── UserRepository.java
│   │   │   │   ├── account/
│   │   │   │   │   ├── Account.java
│   │   │   │   │   └── AccountRepository.java
│   │   │   │   ├── category/
│   │   │   │   │   ├── Category.java
│   │   │   │   │   ├── TransactionType.java
│   │   │   │   │   └── CategoryRepository.java
│   │   │   │   └── transaction/
│   │   │   │       ├── Transaction.java
│   │   │   │       └── TransactionRepository.java
│   │   │   ├── dto/                       # DTO 레이어
│   │   │   │   ├── auth/
│   │   │   │   ├── user/
│   │   │   │   ├── account/
│   │   │   │   ├── transaction/
│   │   │   │   ├── category/
│   │   │   │   └── statistics/
│   │   │   ├── service/                   # 서비스 레이어
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── UserService.java
│   │   │   │   ├── AccountService.java
│   │   │   │   ├── TransactionService.java
│   │   │   │   ├── StatisticsService.java
│   │   │   │   └── CategoryService.java
│   │   │   ├── controller/                # 컨트롤러 레이어
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── UserController.java
│   │   │   │   ├── AccountController.java
│   │   │   │   ├── TransactionController.java
│   │   │   │   ├── StatisticsController.java
│   │   │   │   └── CategoryController.java
│   │   │   ├── security/                  # 보안 관련
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── JwtAuthenticationEntryPoint.java
│   │   │   └── common/                    # 공통 클래스
│   │   │       ├── ApiResponse.java
│   │   │       └── exception/
│   │   │           ├── BusinessException.java
│   │   │           └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           └── init.sql
│   └── test/
└── pom.xml
```

### 주요 클래스 설명

#### Domain Layer (도메인 레이어)

**User (사용자)**
- 사용자 정보 엔티티
- BCrypt로 암호화된 비밀번호 저장
- JPA Auditing으로 생성/수정 시간 자동 관리

**Account (계좌)**
- 은행 계좌 정보
- User와 N:1 관계
- 계좌별 입출금 내역 관리

**Category (카테고리)**
- 수입/지출 카테고리
- 기본 카테고리 데이터는 init.sql에서 초기화

**Transaction (거래 내역)**
- 입출금 거래 정보
- Account와 Category와 관계
- 날짜 인덱스로 조회 성능 최적화

#### Service Layer (서비스 레이어)

**AuthService**
- 회원가입, 로그인, 토큰 갱신 처리
- BCrypt 비밀번호 암호화
- Redis에 Refresh Token 저장

**UserService**
- 사용자 정보 조회/수정
- Redis 캐싱 적용

**AccountService**
- 계좌 CRUD 작업
- 사용자별 계좌 조회

**TransactionService**
- 거래 내역 CRUD
- 캐시 무효화 처리

**StatisticsService**
- 월별 통계 계산
- Redis 캐싱으로 성능 최적화

#### Controller Layer (컨트롤러 레이어)

- RESTful API 엔드포인트 제공
- @Valid로 입력값 검증
- 공통 응답 포맷(ApiResponse) 사용

#### Security (보안)

**JwtTokenProvider**
- JWT 토큰 생성/검증
- Access Token, Refresh Token 관리

**JwtAuthenticationFilter**
- 요청마다 JWT 토큰 검증
- SecurityContext에 인증 정보 설정

**SecurityConfig**
- Spring Security 설정
- CORS, JWT 필터 등록

### 아키텍처 원칙

1. **레이어드 아키텍처**
   - Controller → Service → Repository
   - 의존성 단방향 흐름

2. **도메인 중심 설계**
   - 엔티티에 비즈니스 로직 포함
   - Repository는 데이터 접근만 담당

3. **관심사의 분리**
   - 각 레이어의 책임 명확화
   - Service는 비즈니스 로직, Controller는 HTTP 처리

4. **예외 처리**
   - 전역 예외 핸들러로 일관된 에러 응답
   - BusinessException으로 비즈니스 예외 처리
