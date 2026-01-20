# Docker로 PostgreSQL과 Redis 실행하기

## 방법 1: 데이터베이스만 실행 (권장)

### 실행
```bash
# PostgreSQL과 Redis만 실행
docker-compose -f docker-compose.db.yml up -d

# 또는 전체 스택 실행 (Backend 포함)
docker-compose up -d
```

### 확인
```bash
# 실행 중인 컨테이너 확인
docker ps

# PostgreSQL 로그 확인
docker logs budgetbook-postgres

# Redis 로그 확인
docker logs budgetbook-redis
```

### 중지
```bash
# 컨테이너 중지 (데이터는 유지)
docker-compose -f docker-compose.db.yml stop

# 컨테이너 중지 및 삭제 (데이터는 유지)
docker-compose -f docker-compose.db.yml down

# 컨테이너 및 볼륨 삭제 (데이터 삭제)
docker-compose -f docker-compose.db.yml down -v
```

## 방법 2: 개별 실행

### PostgreSQL만 실행
```bash
docker run -d \
  --name budgetbook-postgres \
  -e POSTGRES_DB=budgetbook \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### Redis만 실행
```bash
docker run -d \
  --name budgetbook-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine
```

## 연결 정보

### PostgreSQL
- **호스트**: `localhost`
- **포트**: `5432`
- **데이터베이스**: `budgetbook`
- **사용자**: `postgres`
- **비밀번호**: `postgres`
- **JDBC URL**: `jdbc:postgresql://localhost:5432/budgetbook`

### Redis
- **호스트**: `localhost`
- **포트**: `6379`
- **비밀번호**: 없음

## 데이터베이스 접속

### PostgreSQL CLI 접속
```bash
# 컨테이너 내부에서 접속
docker exec -it budgetbook-postgres psql -U postgres -d budgetbook

# 또는 외부에서 접속 (psql 설치 필요)
psql -h localhost -U postgres -d budgetbook
```

### Redis CLI 접속
```bash
# 컨테이너 내부에서 접속
docker exec -it budgetbook-redis redis-cli

# 또는 외부에서 접속 (redis-cli 설치 필요)
redis-cli -h localhost -p 6379
```

## 유용한 명령어

### 컨테이너 상태 확인
```bash
docker ps -a
```

### 로그 실시간 확인
```bash
docker logs -f budgetbook-postgres
docker logs -f budgetbook-redis
```

### 컨테이너 재시작
```bash
docker restart budgetbook-postgres
docker restart budgetbook-redis
```

### 데이터베이스 백업 (PostgreSQL)
```bash
docker exec budgetbook-postgres pg_dump -U postgres budgetbook > backup.sql
```

### 데이터베이스 복원 (PostgreSQL)
```bash
docker exec -i budgetbook-postgres psql -U postgres budgetbook < backup.sql
```

## 문제 해결

### 포트 충돌 시
```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# 포트 사용 중인 프로세스 확인 (Linux/Mac)
lsof -i :5432
lsof -i :6379
```

### 컨테이너가 시작되지 않을 때
```bash
# 로그 확인
docker logs budgetbook-postgres
docker logs budgetbook-redis

# 컨테이너 재생성
docker-compose -f docker-compose.db.yml up -d --force-recreate
```

### 데이터 초기화
```bash
# 볼륨 삭제 후 재생성
docker-compose -f docker-compose.db.yml down -v
docker-compose -f docker-compose.db.yml up -d
```
