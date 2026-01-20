-- 테이블 목록 확인
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 또는 간단하게
\dt
