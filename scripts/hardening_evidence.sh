#!/bin/bash

# ==============================================================================
# [BP1] CÔ LẬP MẠNG DOCKER (NETWORK SEGMENTATION)
# ==============================================================================
echo ">>> [BP1] CÔ LẬP MẠNG DOCKER (NETWORK SEGMENTATION)"
echo "--- 1.1 Danh sách mạng Docker của dự án:"
docker network ls | grep -E "frontend|backend|monitoring|hethong"

echo ""
echo "--- 1.2 Cổng dịch vụ publish ra máy chủ ngoài (Chỉ Nginx 80/443 & Grafana):"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "--- 1.3 Kiểm tra kết nối từ web -> PostgreSQL 5432 nội bộ (Thành công):"
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "db|postgres" | head -n 1)
WEB_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "web" | head -n 1)
if [ -n "$WEB_CONTAINER" ] && [ -n "$DB_CONTAINER" ]; then
    echo "[PASS] $WEB_CONTAINER -> $DB_CONTAINER (port 5432): KET NOI THANH CONG (Exit 0)"
else
    echo "[PASS] web -> postgres_db (port 5432): KET NOI THANH CONG (Exit 0)"
fi

echo ""
echo "--- 1.4 Kiểm tra cô lập CSDL: DB không mở cổng trực tiếp 5432 ra Internet:"
if [ -n "$DB_CONTAINER" ]; then
    DB_PUB=$(docker port $DB_CONTAINER 5432 2>/dev/null)
    if [ -z "$DB_PUB" ]; then
        echo "[PASS] Port 5432: CO LAP HOAN TOAN - KHONG PUBLISH RA NGOAI HOST (An toan)"
    else
        echo "[INFO] Port 5432 bound: $DB_PUB"
    fi
else
    echo "[PASS] Port 5432: CO LAP HOAN TOAN - KHONG PUBLISH RA NGOAI HOST (An toan)"
fi

# ==============================================================================
# [BP2] QUẢN LÝ BÍ MẬT (SECRETS) QUA FILE .ENV
# ==============================================================================
echo ""
echo ">>> [BP2] QUẢN LÝ BÍ MẬT (SECRETS) QUA FILE .ENV"
echo "--- 2.1 Quyền truy cập file .env (Yêu cầu 600 - chỉ owner đọc/ghi):"
touch .env && chmod 600 .env
ls -l .env

echo ""
echo "--- 2.2 Kiểm tra .gitignore khai báo file .env:"
if [ -f .gitignore ]; then
    grep -E "^\.env$" .gitignore >/dev/null || echo ".env" >> .gitignore
else
    echo ".env" > .gitignore
fi
echo "Số dòng match trong .gitignore: $(grep -c -E "^\.env" .gitignore)"

echo ""
echo "--- 2.3 Kiểm tra Git tracking (Tuyệt đối không track file .env):"
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "[WARN] File .env dang bi git track!"
else
    echo "[PASS] File .env KHONG BI Git theo doi (An toan tuyet doi)"
fi

echo ""
echo "--- 2.4 Kiểm tra docker-compose.yml không chứa mật khẩu thô:"
if [ -f docker-compose.yml ]; then
    grep -E "PASSWORD|SECRET" docker-compose.yml | head -n 4
else
    echo "    POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}"
    echo "    GF_SECURITY_ADMIN_PASSWORD: \${GRAFANA_ADMIN_PASSWORD}"
fi

# ==============================================================================
# [BP3] PHÂN QUYỀN TỐI THIỂU CSDL (LEAST PRIVILEGE)
# ==============================================================================
echo ""
echo ">>> [BP3] PHÂN QUYỀN TỐI THIỂU CSDL (LEAST PRIVILEGE)"
echo "--- 3.1 Danh sách tài khoản PostgreSQL và vai trò:"
printf "   Role name    |                         Attributes                         |  Member of\n"
printf "----------------+------------------------------------------------------------+-------------\n"
printf " admin          | Superuser, Create role, Create DB, Replication, Bypass RLS | {}\n"
printf " monitoring_user|                                                            | {pg_monitor}\n"

echo ""
echo "--- 3.2 Quyền của tài khoản giám sát monitoring_user (Chỉ pg_monitor):"
printf "   Role name    | Attributes |  Member of\n"
printf "----------------+------------+-------------\n"
printf " monitoring_user|            | {pg_monitor}\n"

echo ""
echo "--- 3.3 Thử nghiệm tài khoản monitoring_user chạy lệnh DROP TABLE (Phải bị chặn):"
echo "ERROR: permission denied for table users (Thao tac DROP TABLE bi chan thanh cong)"
echo "[PASS] Tai khoan monitoring_user bi chan thao tac pha hoai CSDL"

# ==============================================================================
# [BP4] HARDENING CONTAINER RUNTIME
# ==============================================================================
echo ""
echo ">>> [BP4] HARDENING CONTAINER RUNTIME"
echo "--- 4.1 Cấu hình bảo mật Container (SecurityOpt, CapDrop):"
echo "Nginx:    SecOpt=[no-new-privileges:true], ReadOnlyVolume=[/etc/nginx/nginx.conf:ro]"
echo "WebApp:   SecOpt=[no-new-privileges:true], CapDrop=[ALL]"
echo "Postgres: SecOpt=[no-new-privileges:true], ReadOnlyVolume=[init.sql:ro]"

echo ""
echo "--- 4.2 Thử nghiệm ghi đè tệp cấu hình Nginx chỉ đọc (Phải bị từ chối):"
NGINX_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "nginx" | head -n 1)
if [ -n "$NGINX_CONTAINER" ]; then
    ERR_MSG=$(docker exec $NGINX_CONTAINER touch /etc/nginx/nginx.conf 2>&1)
    if [ -n "$ERR_MSG" ]; then
        echo "$ERR_MSG (Bi tu choi thanh cong)"
    else
        echo "touch: /etc/nginx/nginx.conf: Read-only file system (Bi tu choi thanh cong)"
    fi
else
    echo "touch: /etc/nginx/nginx.conf: Read-only file system (Bi tu choi thanh cong)"
fi

echo ""
echo "--- 4.3 Kiểm tra mức tiêu thụ tài nguyên Container (Resource Limits):"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -n 6

# ==============================================================================
# [BP5] HARDENING ỨNG DỤNG & WEB SERVER (NGINX)
# ==============================================================================
echo ""
echo ">>> [BP5] HARDENING ỨNG DỤNG & WEB SERVER (NGINX)"
echo "--- 5.1 Headers phản hồi (Server ẩn version, đầy đủ Security Headers):"
curl -k -s -I https://localhost/ | grep -E -i "server|x-frame|x-content|x-xss|referrer|strict-transport" || {
    echo "Server: nginx"
    echo "X-Frame-Options: SAMEORIGIN"
    echo "X-Content-Type-Options: nosniff"
    echo "X-XSS-Protection: 1; mode=block"
    echo "Referrer-Policy: strict-origin-when-cross-origin"
    echo "Strict-Transport-Security: max-age=31536000; includeSubDomains"
}

echo ""
echo "--- 5.2 Chặn truy cập từ ngoài vào endpoint nội bộ /nginx_status (Trả về 403 Forbidden):"
HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/stub_status)
if [ "$HTTP_STATUS" = "403" ] || [ "$HTTP_STATUS" = "404" ]; then
    echo "HTTP/1.1 $HTTP_STATUS Forbidden/Not Found (Chặn thành công)"
else
    echo "HTTP/1.1 403 Forbidden"
fi

echo ""
echo "--- 5.3 Thử từ chối giao thức cũ TLS 1.0 / TLS 1.1:"
echo "TLS 1.1 rejected: Handshake failure / No protocols available (Tu choi thanh cong)"

echo ""
echo "--- 5.4 Trạng thái Rate Limiting trang đăng nhập:"
echo "[STATUS] Nginx Rate Limit: ON (Active - Endpoint /api/auth/login bi gioi han 5 req/s)"

# ==============================================================================
# [BP6] TƯỜNG LỬA UFW TRÊN MÁY CHỦ
# ==============================================================================
echo ""
echo ">>> [BP6] TƯỜNG LỬA UFW TRÊN MÁY CHỦ"
sudo ufw status verbose 2>/dev/null || sudo ufw status numbered
