# BudgetBook - 가계부 웹 애플리케이션

개인 가계부 관리 및 AI 기반 재무 분석을 제공하는 풀스택 웹 애플리케이션입니다.

## 🚀 빠른 시작

### Docker Compose로 전체 실행 (권장)

```bash
# PostgreSQL, Redis, Backend 자동 실행
docker-compose up -d
```

- **Backend**: http://localhost:8080/api/v1
- **Frontend**: http://localhost:4200 (별도 실행 필요)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 개별 실행

#### Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
ng serve
```

## 📋 주요 기능

- ✅ **사용자 인증**: JWT 기반 회원가입/로그인
- ✅ **계좌 관리**: 여러 계좌 등록 및 잔액 관리
- ✅ **거래 내역**: 수입/지출 기록 및 관리
- ✅ **카테고리 관리**: 사용자별 커스텀 카테고리
- ✅ **통계 분석**: 월별 수입/지출 통계 및 차트
- ✅ **AI 어시스턴트**: 
  - 자연어로 거래 내역 자동 파싱
  - 재무 상담 및 질의응답
  - 채팅 히스토리 관리

## 🛠 기술 스택

### Backend
- **Java 17** + **Spring Boot 3.2.0**
- **Spring Security** + **JWT** 인증
- **Spring Data JPA** + **PostgreSQL**
- **Redis** (캐싱)
- **Ollama** (로컬 LLM 연동)

### Frontend
- **Angular 17**
- **Angular Material**
- **RxJS**

### Infrastructure
- **Docker** + **Docker Compose**
- **Kubernetes** (배포 매니페스트 포함)
- **GitHub Actions** (CI/CD)

## 📁 프로젝트 구조

```
bugetbook/
├── backend/              # Spring Boot 백엔드
│   ├── src/main/java/    # Java 소스 코드
│   └── pom.xml
├── frontend/             # Angular 프론트엔드
│   ├── src/app/          # Angular 소스 코드
│   └── package.json
├── kubernetes/           # K8s 배포 매니페스트
├── docs/                 # 상세 문서
│   ├── api-spec.md       # API 명세서
│   ├── architecture.md   # 아키텍처 설계
│   └── ...
├── docker-compose.yml    # 로컬 개발 환경
└── .github/workflows/    # CI/CD 파이프라인
```

## 🔧 환경 설정

### Backend 설정
`backend/src/main/resources/application.yml`에서 다음 항목을 설정하세요:

- **데이터베이스**: PostgreSQL 연결 정보
- **Redis**: Redis 연결 정보
- **JWT**: Secret Key 및 토큰 만료 시간
- **Ollama**: AI 모델 URL 및 모델명

### Frontend 설정
`frontend/src/environments/`에서 API 엔드포인트를 설정하세요.

## 📚 상세 문서

- [API 명세서](docs/api-spec.md) - REST API 엔드포인트 상세
- [아키텍처 설계](docs/architecture.md) - 시스템 아키텍처
- [데이터베이스 설계](docs/database-design.md) - ERD 및 스키마
- [배포 가이드](docs/deployment-guide.md) - 프로덕션 배포 방법
- [Docker 빠른 시작](docs/docker-quickstart.md) - Docker 사용법

## 🧪 개발

### 데이터베이스 마이그레이션
SQL 마이그레이션 파일은 `backend/src/main/resources/db/migration/`에 위치합니다.

### 테스트 실행
```bash
# Backend 테스트
cd backend
./mvnw test

# Frontend 테스트
cd frontend
npm test
```

## 📝 라이선스

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.
