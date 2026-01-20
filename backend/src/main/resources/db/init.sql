-- 카테고리 기본 데이터 (테이블이 존재할 때만 실행)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        INSERT INTO categories (name, type, icon, created_at, updated_at) VALUES
        -- 수입 카테고리
        ('급여', 'INCOME', 'payments', NOW(), NOW()),
        ('부수입', 'INCOME', 'attach_money', NOW(), NOW()),
        ('용돈', 'INCOME', 'account_balance_wallet', NOW(), NOW()),
        -- 지출 카테고리
        ('식비', 'EXPENSE', 'restaurant', NOW(), NOW()),
        ('교통비', 'EXPENSE', 'directions_bus', NOW(), NOW()),
        ('쇼핑', 'EXPENSE', 'shopping_cart', NOW(), NOW()),
        ('의료비', 'EXPENSE', 'local_hospital', NOW(), NOW()),
        ('통신비', 'EXPENSE', 'phone_android', NOW(), NOW()),
        ('주거비', 'EXPENSE', 'home', NOW(), NOW()),
        ('교육비', 'EXPENSE', 'school', NOW(), NOW()),
        ('문화생활', 'EXPENSE', 'movie', NOW(), NOW()),
        ('기타', 'EXPENSE', 'more_horiz', NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
