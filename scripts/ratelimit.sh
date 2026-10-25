#!/usr/bin/env bash
# Script kiểm tra cấu hình và trạng thái Nginx Rate Limit chống Brute-force
set -e

echo "=== KIỂM TRA RATE LIMIT TRÊN NGINX (/api/auth/login) ==="
grep -n "limit_req" nginx/nginx.conf

echo ""
echo "Thực hiện bắn thử 10 request đăng nhập liên tiếp để kiểm tra mã 429/503:"
for i in {1..10}; do
  code=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST https://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpassword"}')
  echo "Request #$i -> HTTP Status: $code"
done
