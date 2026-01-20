# 가계부 웹 애플리케이션 (Budget Book)

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
- AWS (EC2, RDS, ElastiCache, S3, ALB) (구현X)
- Docker
- Kubernetes (EKS) (구현X)
- Nginx (구현X)

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

## 주요 기능

### 완성된 기능
- ✅ 사용자 인증 (JWT)
- ✅ 사용자 관리
- ✅ 계좌 관리
- ✅ 거래 내역 관리
- ✅ 카테고리 관리
- ✅ 월별 통계
- ✅ Redis 캐싱