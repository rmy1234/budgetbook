-- 기존 categories를 각 사용자에게 할당하는 마이그레이션 스크립트
-- 각 transaction의 account.user_id를 기준으로 category를 복제

-- 1단계: 각 사용자가 사용하는 category를 복제하여 새로운 category 생성
INSERT INTO categories (user_id, name, type, icon, created_at, updated_at)
SELECT DISTINCT 
    a.user_id,
    c.name,
    c.type,
    c.icon,
    c.created_at,
    NOW()
FROM categories c
INNER JOIN transactions t ON t.category_id = c.id
INNER JOIN accounts a ON t.account_id = a.id
WHERE c.user_id IS NULL
ON CONFLICT DO NOTHING;

-- 2단계: 기존 transactions의 category_id를 새로 생성된 category로 업데이트
UPDATE transactions t
SET category_id = (
    SELECT nc.id
    FROM categories nc
    INNER JOIN accounts a ON a.user_id = nc.user_id AND a.id = t.account_id
    INNER JOIN categories oc ON oc.name = nc.name AND oc.type = nc.type AND oc.id = t.category_id
    WHERE nc.user_id IS NOT NULL
      AND nc.user_id = a.user_id
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM categories c
    WHERE c.id = t.category_id
      AND c.user_id IS NULL
);

-- 3단계: user_id가 NULL인 기존 categories 삭제
DELETE FROM categories WHERE user_id IS NULL;
