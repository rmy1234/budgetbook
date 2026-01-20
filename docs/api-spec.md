# REST API 명세서

## 3️⃣ REST API 명세서

### 기본 정보
- Base URL: `https://api.budgetbook.com/api/v1`
- 인증 방식: JWT Bearer Token
- 응답 포맷: JSON

### 공통 응답 포맷

#### 성공 응답
```json
{
  "success": true,
  "data": {},
  "message": "성공 메시지",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 인증 API

### 1. 회원가입
- **URL**: `POST /auth/signup`
- **인증**: 불필요
- **Request Body**:
```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "password": "SecurePassword123!",
  "age": 30
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "email": "hong@example.com",
    "age": 30,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. 로그인
- **URL**: `POST /auth/login`
- **인증**: 불필요
- **Request Body**:
```json
{
  "email": "hong@example.com",
  "password": "SecurePassword123!"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

### 3. 토큰 갱신
- **URL**: `POST /auth/refresh`
- **인증**: 불필요
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response**: 로그인과 동일

### 4. 로그아웃
- **URL**: `POST /auth/logout`
- **인증**: 필요
- **Response**:
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

---

## 사용자 API

### 1. 내 정보 조회
- **URL**: `GET /users/me`
- **인증**: 필요
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "email": "hong@example.com",
    "age": 30,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. 내 정보 수정
- **URL**: `PUT /users/me`
- **인증**: 필요
- **Request Body**:
```json
{
  "name": "홍길동",
  "age": 31
}
```
- **Response**: 내 정보 조회와 동일

---

## 계좌 API

### 1. 계좌 목록 조회
- **URL**: `GET /accounts`
- **인증**: 필요
- **Query Parameters**:
  - `bankName` (optional): 은행명 필터
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bankName": "KB국민은행",
      "alias": "주거래 통장",
      "balance": 1000000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. 계좌 생성
- **URL**: `POST /accounts`
- **인증**: 필요
- **Request Body**:
```json
{
  "bankName": "KB국민은행",
  "alias": "주거래 통장"
}
```
- **Response**: 단일 계좌 객체

### 3. 계좌 수정
- **URL**: `PUT /accounts/{id}`
- **인증**: 필요
- **Request Body**:
```json
{
  "alias": "새로운 별칭"
}
```

### 4. 계좌 삭제
- **URL**: `DELETE /accounts/{id}`
- **인증**: 필요

---

## 거래 내역 API

### 1. 거래 내역 목록 조회
- **URL**: `GET /transactions`
- **인증**: 필요
- **Query Parameters**:
  - `accountId` (optional): 계좌 ID 필터
  - `categoryId` (optional): 카테고리 ID 필터
  - `type` (optional): `INCOME` | `EXPENSE`
  - `startDate` (optional): 시작일 (ISO 8601)
  - `endDate` (optional): 종료일 (ISO 8601)
  - `page` (optional, default: 0): 페이지 번호
  - `size` (optional, default: 20): 페이지 크기
- **Response**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "accountId": 1,
        "accountAlias": "주거래 통장",
        "type": "EXPENSE",
        "amount": 15000,
        "categoryId": 1,
        "categoryName": "식비",
        "memo": "점심 식사",
        "transactionDate": "2024-01-15T12:00:00Z",
        "createdAt": "2024-01-15T12:05:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

### 2. 거래 내역 생성
- **URL**: `POST /transactions`
- **인증**: 필요
- **Request Body**:
```json
{
  "accountId": 1,
  "type": "EXPENSE",
  "amount": 15000,
  "categoryId": 1,
  "memo": "점심 식사",
  "transactionDate": "2024-01-15T12:00:00Z"
}
```
- **Response**: 단일 거래 내역 객체

### 3. 거래 내역 수정
- **URL**: `PUT /transactions/{id}`
- **인증**: 필요
- **Request Body**: 거래 내역 생성과 동일

### 4. 거래 내역 삭제
- **URL**: `DELETE /transactions/{id}`
- **인증**: 필요

### 5. 거래 내역 상세 조회
- **URL**: `GET /transactions/{id}`
- **인증**: 필요

---

## 통계 API

### 1. 월별 통계
- **URL**: `GET /statistics/monthly`
- **인증**: 필요
- **Query Parameters**:
  - `year` (required): 연도
  - `month` (required): 월 (1-12)
- **Response**:
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "totalIncome": 3000000,
    "totalExpense": 2000000,
    "balance": 1000000,
    "categoryExpenses": [
      {
        "categoryId": 1,
        "categoryName": "식비",
        "amount": 500000,
        "percentage": 25.0
      },
      {
        "categoryId": 2,
        "categoryName": "교통비",
        "amount": 300000,
        "percentage": 15.0
      }
    ]
  }
}
```

### 2. 일별 통계
- **URL**: `GET /statistics/daily`
- **인증**: 필요
- **Query Parameters**:
  - `startDate` (required): 시작일
  - `endDate` (required): 종료일
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "income": 0,
      "expense": 50000,
      "balance": -50000
    },
    {
      "date": "2024-01-16",
      "income": 100000,
      "expense": 30000,
      "balance": 20000
    }
  ]
}
```

---

## 카테고리 API

### 1. 카테고리 목록 조회
- **URL**: `GET /categories`
- **인증**: 필요
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "식비",
      "type": "EXPENSE",
      "icon": "restaurant"
    },
    {
      "id": 2,
      "name": "교통비",
      "type": "EXPENSE",
      "icon": "directions_bus"
    }
  ]
}
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| `AUTH_001` | 인증 실패 |
| `AUTH_002` | 토큰 만료 |
| `AUTH_003` | 권한 없음 |
| `USER_001` | 사용자 없음 |
| `USER_002` | 이메일 중복 |
| `ACCOUNT_001` | 계좌 없음 |
| `ACCOUNT_002` | 계좌 소유권 없음 |
| `TRANSACTION_001` | 거래 내역 없음 |
| `TRANSACTION_002` | 계좌 잔액 부족 |
| `VALIDATION_001` | 입력값 검증 실패 |
