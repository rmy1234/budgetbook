-- accounts 테이블에 balance 컬럼 추가
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- 기존 계좌의 잔액을 0으로 초기화 (이미 NULL이 아닌 경우는 그대로 유지)
UPDATE accounts 
SET balance = 0 
WHERE balance IS NULL;
