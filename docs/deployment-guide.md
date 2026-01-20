# 배포 가이드

## 7️⃣ Dockerfile / docker-compose 예제
## 8️⃣ Kubernetes 배포 예제
## 9️⃣ GitHub Actions CI/CD 예제

### 로컬 개발 환경 실행

#### 1. Prerequisites
- Docker & Docker Compose
- Java 17 (선택사항)
- Node.js 20 (선택사항)

#### 2. Docker Compose로 실행

```bash
# 전체 스택 실행 (PostgreSQL + Redis + Backend)
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 중지
docker-compose down
```

#### 3. 개별 실행

**Backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

---

### AWS EKS 배포

#### 1. EKS 클러스터 생성

```bash
# EKS 클러스터 생성
eksctl create cluster \
  --name budgetbook-cluster \
  --region ap-northeast-2 \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5
```

#### 2. 네임스페이스 생성

```bash
kubectl create namespace budgetbook
```

#### 3. 시크릿 생성

```bash
# 데이터베이스 시크릿
kubectl create secret generic budgetbook-secrets \
  --from-literal=database-url=jdbc:postgresql://<RDS_ENDPOINT>:5432/budgetbook \
  --from-literal=database-username=postgres \
  --from-literal=database-password=<PASSWORD> \
  --from-literal=jwt-secret=<JWT_SECRET> \
  -n budgetbook

# ConfigMap 생성
kubectl create configmap budgetbook-config \
  --from-literal=redis-host=<ELASTICACHE_ENDPOINT> \
  -n budgetbook
```

#### 4. 배포 실행

```bash
# Backend 배포
kubectl apply -f kubernetes/backend-deployment.yaml

# Frontend 배포
kubectl apply -f kubernetes/frontend-deployment.yaml

# Ingress 배포
kubectl apply -f kubernetes/ingress.yaml

# HPA 배포
kubectl apply -f kubernetes/hpa.yaml
```

#### 5. 배포 상태 확인

```bash
# Pod 상태 확인
kubectl get pods -n budgetbook

# 서비스 상태 확인
kubectl get svc -n budgetbook

# Ingress 상태 확인
kubectl get ingress -n budgetbook

# 배포 상태 확인
kubectl rollout status deployment/budgetbook-backend -n budgetbook
```

---

### 무중단 배포 전략

#### 1. Rolling Update (기본)
- 새 Pod가 생성되면서 기존 Pod가 점진적으로 교체
- Deployment에서 `strategy.type: RollingUpdate` 사용

#### 2. Blue-Green 배포
```yaml
# Blue Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: budgetbook-backend-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: budgetbook-backend
      version: blue
  template:
    metadata:
      labels:
        app: budgetbook-backend
        version: blue
    spec:
      containers:
      - name: backend
        image: budgetbook-backend:v1
```

#### 3. Canary 배포
- 일부 트래픽만 새 버전으로 라우팅
- Istio 또는 Flagger 사용

---

### CI/CD 파이프라인

#### GitHub Actions 워크플로우

1. **PR 생성 시**
   - 코드 체크아웃
   - Backend: Maven 빌드 및 테스트
   - Frontend: npm install, lint, test

2. **Main 브랜치 Push 시**
   - Backend: Docker 이미지 빌드 → ECR Push
   - Frontend: Docker 이미지 빌드 → ECR Push
   - EKS 배포 자동 실행
   - 배포 상태 확인

#### GitHub Secrets 설정

필요한 Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

#### 수동 배포

```bash
# 이미지 업데이트 후
kubectl set image deployment/budgetbook-backend \
  backend=<ECR_IMAGE_URL> \
  -n budgetbook

# 롤아웃 확인
kubectl rollout status deployment/budgetbook-backend -n budgetbook

# 롤백 (필요 시)
kubectl rollout undo deployment/budgetbook-backend -n budgetbook
```

---

### 모니터링

#### 1. 로그 확인

```bash
# Pod 로그
kubectl logs -f <pod-name> -n budgetbook

# 여러 Pod 로그
kubectl logs -f -l app=budgetbook-backend -n budgetbook

# 이전 컨테이너 로그
kubectl logs --previous <pod-name> -n budgetbook
```

#### 2. 리소스 모니터링

```bash
# Pod 리소스 사용량
kubectl top pods -n budgetbook

# Node 리소스 사용량
kubectl top nodes
```

#### 3. 헬스 체크

```bash
# Pod 상태 확인
kubectl describe pod <pod-name> -n budgetbook

# 이벤트 확인
kubectl get events -n budgetbook --sort-by='.lastTimestamp'
```

---

### 트러블슈팅

#### Pod가 계속 재시작되는 경우

```bash
# Pod 상세 정보 확인
kubectl describe pod <pod-name> -n budgetbook

# 로그 확인
kubectl logs <pod-name> -n budgetbook
```

#### 이미지 Pull 에러

```bash
# 이미지 확인
kubectl describe pod <pod-name> -n budgetbook | grep Image

# ECR 로그인 확인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com
```

#### 데이터베이스 연결 에러

```bash
# RDS 엔드포인트 확인
kubectl get secret budgetbook-secrets -n budgetbook -o jsonpath='{.data.database-url}' | base64 -d

# 네트워크 연결 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nc -zv <RDS_ENDPOINT> 5432
```

---

### 백업 및 복구

#### 1. 데이터베이스 백업

```bash
# RDS 스냅샷 생성
aws rds create-db-snapshot \
  --db-instance-identifier budgetbook-db \
  --db-snapshot-identifier budgetbook-snapshot-$(date +%Y%m%d)
```

#### 2. Redis 백업

```bash
# ElastiCache 스냅샷 생성
aws elasticache create-snapshot \
  --replication-group-id budgetbook-redis \
  --snapshot-name budgetbook-redis-snapshot-$(date +%Y%m%d)
```

---

### 스케일링

#### 수동 스케일링

```bash
# Pod 수 증가
kubectl scale deployment budgetbook-backend --replicas=5 -n budgetbook

# HPA 확인
kubectl get hpa -n budgetbook
```

#### 자동 스케일링 (HPA)

HPA는 CPU/메모리 사용률에 따라 자동으로 Pod 수를 조정합니다.

```bash
# HPA 상태 확인
kubectl get hpa budgetbook-backend-hpa -n budgetbook

# HPA 상세 정보
kubectl describe hpa budgetbook-backend-hpa -n budgetbook
```
