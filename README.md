# 가계부 웹 애플리케이션 (Budget Book)

실서비스 수준의 가계부 관리 웹 애플리케이션

## 기술 스택

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA
- Redis (캐시 + 세션)
- PostgreSQL

### Frontend
- Angular (LTS)
- Angular Material
- JWT 인증

### Infrastructure
- AWS (EC2, RDS, ElastiCache, S3, ALB)
- Docker
- Kubernetes (EKS)
- Nginx

### CI/CD
- GitHub Actions
- Docker Registry (ECR)
- EKS 자동 배포

## 프로젝트 구조

```
bugetbook/
├── backend/                 # Spring Boot 백엔드
│   ├── src/
│   │   └── main/
│   │       ├── java/com/budgetbook/
│   │       └── resources/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # Angular 프론트엔드
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── kubernetes/              # K8s 배포 매니페스트
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
├── docs/                    # 문서
│   ├── architecture.md
│   ├── api-spec.md
│   ├── database-design.md
│   ├── redis-strategy.md
│   ├── backend-structure.md
│   ├── frontend-structure.md
│   ├── deployment-guide.md
│   └── expansion-ideas.md
├── docker-compose.yml       # 로컬 개발용
└── .github/
    └── workflows/
        └── ci-cd.yml        # CI/CD 파이프라인
```

## 빠른 시작

### 로컬 개발 환경

```bash
docker-compose up -d
```

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

## 문서

- **아키텍처**: [`docs/architecture.md`](docs/architecture.md)
- **API 명세서**: [`docs/api-spec.md`](docs/api-spec.md)
- **데이터베이스 설계**: [`docs/database-design.md`](docs/database-design.md)
- **Redis 전략**: [`docs/redis-strategy.md`](docs/redis-strategy.md)
- **백엔드 구조**: [`docs/backend-structure.md`](docs/backend-structure.md)
- **프론트엔드 구조**: [`docs/frontend-structure.md`](docs/frontend-structure.md)
- **배포 가이드**: [`docs/deployment-guide.md`](docs/deployment-guide.md)
- **확장 아이디어**: [`docs/expansion-ideas.md`](docs/expansion-ideas.md)

## 주요 기능

### 완성된 기능
- ✅ 사용자 인증 (JWT)
- ✅ 사용자 관리
- ✅ 계좌 관리
- ✅ 거래 내역 관리
- ✅ 카테고리 관리
- ✅ 월별 통계
- ✅ Redis 캐싱

### 예정된 기능
- 🔄 거래 내역 상세 UI
- 🔄 계좌 관리 UI
- 🔄 통계 차트
- 🔄 OCR 영수증 인식
- 🔄 결제 연동
