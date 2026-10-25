# 🛡️ Báo cáo Chi tiết 6 Biện pháp Hardening Hệ thống

- **Đề tài:** Đề 1 - Hệ thống Quản lý Thư viện
- **Sinh viên thực hiện:** CẤN VĂN THÁI
- **Mã số sinh viên (MSSV):** DTC245200867
- **Lớp:** CNTT-K23C

---

## 1. Chạy Container Web dưới quyền Non-root User
- **Mục tiêu:** Ngăn chặn kẻ tấn công leo thang đặc quyền (`root`) trên máy chủ host nếu ứng dụng web bị khai thác lỗ hổng.
- **Triển khai:** Khai báo `USER node` trong [`web/Dockerfile`](../web/Dockerfile) và tắt header `x-powered-by` trong [`web/src/app.js`](../web/src/app.js).
- **Lệnh kiểm chứng:**
  ```bash
  docker exec hethong-thu-vien-web-1 id
  # Kết quả: uid=1000(node) gid=1000(node) groups=1000(node)
  ```

## 2. Cô lập Mạng Nội bộ Cơ sở Dữ liệu (`Network Isolation`)
- **Mục tiêu:** Cách ly hoàn toàn PostgreSQL khỏi mạng bên ngoài; chỉ cho phép container `web` và `pgadmin` giao tiếp với `db`.
- **Triển khai:** Thiết lập `backend_net` với thuộc tính `internal: true` trong [`docker-compose.yml`](../docker-compose.yml) và không mở cổng `5432` ra máy host.

## 3. Mã hóa HTTPS/TLS & Tự động Chuyển hướng HTTP -> HTTPS
- **Mục tiêu:** Bảo vệ thông tin đăng nhập và phiên làm việc của Thủ thư/Độc giả khỏi nghe lén trên đường truyền.
- **Triển khai:** Cấu hình SSL (`TLSv1.2`, `TLSv1.3`) trên Nginx tại [`nginx/nginx.conf`](../nginx/nginx.conf) và trả mã `301 Moved Permanently` từ cổng `80` sang `443`.

## 4. Thiết lập HTTP Security Headers & Ẩn Phiên bản Máy chủ
- **Mục tiêu:** Chống tấn công Clickjacking, MIME-sniffing, XSS và giấu thông tin phiên bản Nginx.
- **Triển khai:** Cấu hình trong [`nginx/nginx.conf`](../nginx/nginx.conf):
  - `server_tokens off;`
  - `add_header X-Frame-Options "SAMEORIGIN" always;`
  - `add_header X-Content-Type-Options "nosniff" always;`
  - `add_header X-XSS-Protection "1; mode=block" always;`

## 5. Giới hạn Tần suất Request (`Rate Limiting`) chống Brute-force
- **Mục tiêu:** Ngăn chặn công cụ tự động dò mật khẩu liên tục vào endpoint `/api/auth/login`.
- **Triển khai:** Khai báo `limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;` trong [`nginx/nginx.conf`](../nginx/nginx.conf).

## 6. Quản lý Bí mật & Mount Cấu hình Read-Only (`:ro`)
- **Mục tiêu:** Không lưu mật khẩu cứng trong Git và ngăn container tự ý ghi đè file cấu hình hệ thống.
- **Triển khai:**
  - Loại trừ `.env` trong [`.gitignore`](../.gitignore), cung cấp file mẫu [`.env.example`](../.env.example).
  - Toàn bộ volume cấu hình (`nginx.conf`, `prometheus.yml`, `loki-config.yml`, `promtail-config.yml`, `init.sql`) đều được gắn cờ `:ro` (Read-Only).
