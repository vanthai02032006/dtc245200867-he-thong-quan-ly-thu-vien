# 🚨 Kịch bản Sự cố An toàn Thông tin & Truy vết LogQL trên Loki

- **Đề tài:** Đề 1 - Hệ thống Quản lý Thư viện
- **Sinh viên thực hiện:** CẤN VĂN THÁI — **MSSV:** DTC245200867 — **Lớp:** CNTT-K23C

---

## 1. Mô tả Kịch bản Sự cố
Kẻ tấn công thực hiện dò mật khẩu tài khoản Quản trị viên (`admin`) trên trang Đăng nhập của **Hệ thống Quản lý Thư viện** (`/api/auth/login`), đồng thời gửi các request gây lỗi ngoại lệ HTTP 500 (`/test-error`).

## 2. Cơ chế Ghi nhận & Thu thập Log Tập trung
1. Khi đăng nhập sai mật khẩu, dịch vụ [`web/src/services/auth.service.js`](../web/src/services/auth.service.js) lập tức xuất log chuẩn hóa ra `stderr`:
   ```text
   [LOGIN_FAILED] 2026-10-24T03:55:00.000Z | Failed login attempt for username="admin"
   ```
2. **Promtail** đọc luồng log từ Docker socket và đẩy về **Loki** với nhãn `service="web"`.

## 3. Các Truy vấn LogQL phục vụ Điều tra & Truy vết trên Grafana

### Truy vấn 1: Xem toàn bộ nhật ký hoạt động của Web Quản lý Thư viện
```logql
{service="web"}
```

### Truy vấn 2: Lọc các hành vi Đăng nhập thất bại (`LOGIN_FAILED`)
```logql
{service="web"} |= "LOGIN_FAILED"
```

### Truy vấn 3: Lọc các lỗi máy chủ nghiêm trọng (`HTTP 500 / ERROR`)
```logql
{service="web"} |= "ERROR"
```

### Truy vấn 4: Đếm tần suất tấn công Brute-force trong mỗi 5 phút (dùng cho Alert Rule)
```logql
count_over_time({service="web"} |= "LOGIN_FAILED" [5m])
```

## 4. Biện pháp Ngăn chặn & Khắc phục
- Kích hoạt **Nginx Rate Limit** (`limit_req zone=login_limit burst=3 nodelay;`) tại [`nginx/nginx.conf`](../nginx/nginx.conf) để chặn các IP vượt ngưỡng `5 requests/phút`.
- Cảnh báo tự động qua rule [`grafana/provisioning/alerting/alert-rules.yml`](../grafana/provisioning/alerting/alert-rules.yml).
