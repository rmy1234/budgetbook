# 데이터베이스 설계

## 4️⃣ PostgreSQL ERD 및 테이블 정의

### ERD 다이어그램

```
┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │
│ name             │
│ email (UNIQUE)   │
│ password         │
│ age              │
│ role             │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         │
┌────────▼─────────┐
│     accounts     │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ bank_name        │
│ alias            │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         │
┌────────▼────────────┐
│   transactions      │
├─────────────────────┤
│ id (PK)             │
│ account_id (FK)     │
│ category_id (FK)    │
│ type                │
│ amount              │
│ memo                │
│ transaction_date    │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ N:1
           │
┌──────────▼──────────┐
│    categories       │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ type                │
│ icon                │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## 테이블 정의

### 1. users (사용자)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    age INTEGER,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. accounts (계좌)
```sql
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    alias VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_bank_name ON accounts(bank_name);
```

### 3. categories (카테고리)
```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'INCOME' or 'EXPENSE'
    icon VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_type ON categories(type);
```

### 4. transactions (거래 내역)
```sql
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'INCOME' or 'EXPENSE'
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    memo TEXT,
    transaction_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) 
        REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) 
        REFERENCES categories(id)
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date DESC);
```

## 인덱스 설계

### 주요 인덱스 전략

1. **Primary Key**: 모든 테이블의 `id` (자동 생성)
2. **Foreign Key**: 참조 무결성을 위한 FK 인덱스
3. **조회 최적화**:
   - `users.email`: 로그인 시 빠른 조회
   - `accounts.user_id`: 사용자별 계좌 조회
   - `transactions.account_id + transaction_date`: 계좌별 날짜순 조회
   - `transactions.transaction_date`: 기간별 조회

### 복합 인덱스

```sql
-- 거래 내역 조회 최적화 (계좌별 + 날짜순)
CREATE INDEX idx_transactions_account_date 
    ON transactions(account_id, transaction_date DESC);

-- 통계 조회 최적화 (타입별 + 날짜별)
CREATE INDEX idx_transactions_type_date 
    ON transactions(type, transaction_date);
```

## 정규화

### 정규화 수준: 3NF (제3정규형)

1. **1NF (제1정규형)**: 모든 컬럼이 원자값
2. **2NF (제2정규형)**: 부분 함수 종속 제거
   - `transactions`에서 `account_id`로 계좌 정보 참조
   - `category_id`로 카테고리 정보 참조
3. **3NF (제3정규형)**: 이행 함수 종속 제거
   - 모든 테이블이 비키 속성에 대해 직접 종속

### 비정규화 고려사항

성능 최적화를 위한 선택적 비정규화:

1. **계좌 잔액 계산**: 
   - 매번 계산하지 않고 `accounts.balance` 컬럼 추가 가능
   - 트리거로 자동 업데이트 또는 애플리케이션 레벨에서 관리

2. **거래 내역에 계좌명 포함**:
   - 조인 없이 조회를 위해 `transactions.account_alias` 추가 가능
   - 하지만 데이터 일관성 문제 발생 가능성

**결론**: 초기에는 정규화 유지, 성능 이슈 발생 시 비정규화 검토

## 시드 데이터

### 카테고리 기본 데이터

```sql
-- 수입 카테고리
INSERT INTO categories (name, type, icon) VALUES
('급여', 'INCOME', 'payments'),
('부수입', 'INCOME', 'attach_money'),
('용돈', 'INCOME', 'account_balance_wallet');

-- 지출 카테고리
INSERT INTO categories (name, type, icon) VALUES
('식비', 'EXPENSE', 'restaurant'),
('교통비', 'EXPENSE', 'directions_bus'),
('쇼핑', 'EXPENSE', 'shopping_cart'),
('의료비', 'EXPENSE', 'local_hospital'),
('통신비', 'EXPENSE', 'phone_android'),
('주거비', 'EXPENSE', 'home'),
('교육비', 'EXPENSE', 'school'),
('문화생활', 'EXPENSE', 'movie'),
('기타', 'EXPENSE', 'more_horiz');
```

## 데이터 무결성 제약조건

1. **참조 무결성**: 
   - FK 제약조건으로 `ON DELETE CASCADE` 설정
   - 계좌 삭제 시 거래 내역 자동 삭제

2. **도메인 무결성**:
   - `amount > 0` CHECK 제약조건
   - `type` ENUM 값 제한 (애플리케이션 레벨)

3. **엔티티 무결성**:
   - PRIMARY KEY 제약조건

## 성능 최적화

### 파티셔닝 전략 (대용량 데이터 대비)

```sql
-- 연도별 파티셔닝 (선택사항)
CREATE TABLE transactions_2024 PARTITION OF transactions
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 쿼리 최적화

1. **인덱스 활용**: WHERE 절에 인덱스 컬럼 사용
2. **LIMIT 사용**: 페이지네이션 필수
3. **JOIN 최소화**: 필요한 컬럼만 SELECT
