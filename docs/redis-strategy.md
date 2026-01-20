# Redis 사용 전략

## 5️⃣ Redis 사용 전략

### 1. 캐시 전략

#### 1.1 세션 관리 (JWT Refresh Token)

**Key Pattern**: `refresh_token:{userId}:{tokenId}`

```java
// 저장
redisTemplate.opsForValue().set(
    "refresh_token:" + userId + ":" + tokenId,
    refreshToken,
    Duration.ofDays(7) // 7일 TTL
);

// 조회
String token = redisTemplate.opsForValue().get(
    "refresh_token:" + userId + ":" + tokenId
);
```

**TTL**: 7일

#### 1.2 사용자 정보 캐싱

**Key Pattern**: `user:{userId}`

```java
// 저장
redisTemplate.opsForValue().set(
    "user:" + userId,
    userInfoJson,
    Duration.ofMinutes(30)
);

// 조회
String userInfo = redisTemplate.opsForValue().get("user:" + userId);
```

**TTL**: 30분

#### 1.3 월별 통계 캐싱

**Key Pattern**: `statistics:monthly:{userId}:{year}:{month}`

```java
// 저장
redisTemplate.opsForValue().set(
    "statistics:monthly:" + userId + ":" + year + ":" + month,
    statisticsJson,
    Duration.ofMinutes(10)
);

// 조회
String stats = redisTemplate.opsForValue().get(
    "statistics:monthly:" + userId + ":" + year + ":" + month
);
```

**TTL**: 10분
**Invalidation**: 거래 내역 생성/수정/삭제 시 해당 월 캐시 삭제

```java
// 캐시 무효화
redisTemplate.delete(
    "statistics:monthly:" + userId + ":" + year + ":" + month
);
```

#### 1.4 계좌 목록 캐싱

**Key Pattern**: `accounts:{userId}`

```java
// 저장
redisTemplate.opsForValue().set(
    "accounts:" + userId,
    accountsJson,
    Duration.ofMinutes(5)
);

// 조회
String accounts = redisTemplate.opsForValue().get("accounts:" + userId);
```

**TTL**: 5분
**Invalidation**: 계좌 생성/수정/삭제 시

#### 1.5 거래 내역 캐싱 (최근 조회)

**Key Pattern**: `transactions:{userId}:{accountId}:{page}:{size}`

```java
// 저장 (페이지별)
redisTemplate.opsForValue().set(
    "transactions:" + userId + ":" + accountId + ":" + page + ":" + size,
    transactionsJson,
    Duration.ofMinutes(5)
);
```

**TTL**: 5분
**Invalidation**: 해당 계좌의 거래 내역 생성/수정/삭제 시 관련 캐시 삭제

### 2. 캐시 무효화 전략

#### Cache-Aside Pattern

```java
// 조회 시
public StatisticsDto getMonthlyStatistics(Long userId, int year, int month) {
    String cacheKey = "statistics:monthly:" + userId + ":" + year + ":" + month;
    
    // 1. 캐시 확인
    String cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
        return objectMapper.readValue(cached, StatisticsDto.class);
    }
    
    // 2. DB 조회
    StatisticsDto stats = calculateStatistics(userId, year, month);
    
    // 3. 캐시 저장
    redisTemplate.opsForValue().set(
        cacheKey,
        objectMapper.writeValueAsString(stats),
        Duration.ofMinutes(10)
    );
    
    return stats;
}

// 수정 시
public void createTransaction(TransactionDto dto) {
    // 1. DB 저장
    transactionRepository.save(transaction);
    
    // 2. 관련 캐시 무효화
    String cacheKey = "statistics:monthly:" + dto.getUserId() + 
                      ":" + dto.getYear() + ":" + dto.getMonth();
    redisTemplate.delete(cacheKey);
    
    // 3. 거래 내역 캐시 무효화
    redisTemplate.delete("transactions:" + dto.getUserId() + ":*");
}
```

### 3. Redis 데이터 구조

#### 3.1 String (기본)
- 사용자 정보
- 통계 데이터
- JSON 직렬화된 객체

#### 3.2 Hash (선택사항)
```java
// 사용자 정보를 Hash로 저장
redisTemplate.opsForHash().putAll(
    "user:" + userId,
    Map.of(
        "name", user.getName(),
        "email", user.getEmail(),
        "age", String.valueOf(user.getAge())
    )
);
```

#### 3.3 Sorted Set (선택사항)
```java
// 최근 조회한 거래 내역 ID 저장
redisTemplate.opsForZSet().add(
    "recent_transactions:" + userId,
    transactionId.toString(),
    System.currentTimeMillis()
);
```

### 4. 캐시 키 네이밍 규칙

```
{entity}:{identifier}:{parameters}
```

예시:
- `user:1`
- `accounts:1`
- `statistics:monthly:1:2024:1`
- `transactions:1:2:0:20`
- `refresh_token:1:abc123`

### 5. Redis 설정

#### Connection Pool
```properties
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.password=
spring.redis.timeout=2000ms
spring.redis.lettuce.pool.max-active=8
spring.redis.lettuce.pool.max-idle=8
spring.redis.lettuce.pool.min-idle=0
```

### 6. 캐시 모니터링

#### 주요 메트릭
- Hit Rate
- Miss Rate
- Memory Usage
- Connection Count
- Command Latency

#### Redis 명령어
```bash
# 메모리 사용량
redis-cli INFO memory

# 키 개수
redis-cli DBSIZE

# 특정 패턴 키 조회
redis-cli KEYS "statistics:*"

# 특정 키 TTL 확인
redis-cli TTL "user:1"
```

### 7. 장애 대응

#### Fallback 전략
```java
public StatisticsDto getMonthlyStatistics(Long userId, int year, int month) {
    try {
        // Redis 조회 시도
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return objectMapper.readValue(cached, StatisticsDto.class);
        }
    } catch (Exception e) {
        log.warn("Redis 조회 실패, DB에서 조회", e);
    }
    
    // Redis 실패 시 DB 조회
    return calculateStatistics(userId, year, month);
}
```

### 8. 캐시 워밍업 (선택사항)

애플리케이션 시작 시 자주 조회되는 데이터 사전 로딩:

```java
@PostConstruct
public void warmupCache() {
    // 인기 카테고리 등 사전 캐싱
}
```
