# Hệ Thống Quản Lý Thư Viện (Đề Tài 01)
**Kho lưu trữ:** dtc245200867-he-thong-quan-ly-thu-vien  
**Học phần:** Triển khai và Quản trị Hệ thống Phần mềm  
**Học viện/Trường:** Đại học Công nghệ Thông tin & Truyền thông - Đại học Thái Nguyên (ICTU)  

---

## 1. Giới thiệu và thông tin sinh viên
- **Sinh viên thực hiện:** Cấn Văn Thái
- **Mã số sinh viên (MSSV):** DTC245200867
- **Lớp:** CNTT-K23C
- **Email:** dtc245200867@ictu.edu.vn / vanthai02032006@gmail.com
- **Mô tả đề tài:** Dự án xây dựng, đóng gói và triển khai hệ thống phần mềm Quản lý Thư viện theo phương pháp luận DevSecOps. Ứng dụng được kiến trúc theo mô hình Microservices/Containerized trên nền tảng Docker Compose, tích hợp cổng Nginx Reverse Proxy bảo mật HTTPS (TLS 1.2/1.3), phân vùng mạng nội bộ độc lập, hệ thống giám sát số liệu thời gian thực (Prometheus, cAdvisor, Grafana), thu thập log tập trung (Loki & Promtail), cơ chế cảnh báo tự động phát hiện tấn công Brute-Force và áp dụng 6 biện pháp Hardening củng cố an ninh toàn diện.

---

## 2. Kiến trúc và danh sách dịch vụ kèm phiên bản
Hệ thống gồm các container dịch vụ hoạt động đồng thời, được phân chia theo 3 mạng nội bộ (`frontend_net`, `backend_net` chế độ `internal: true`, `monitoring_net`):

| Dịch vụ | Container Image / Phiên bản | Vai trò & Cổng kết nối | Mạng Docker |
| :--- | :--- | :--- | :--- |
| **nginx** | `nginx:alpine` | Reverse Proxy, SSL Termination, Rate Limiting (Cổng công khai: 80/tcp, 443/tcp) | `frontend_net`, `monitoring_net` |
| **web** | `hethong-thu-vien-web` (Node.js 20-alpine) | Ứng dụng Web Quản lý thư viện (Cổng nội bộ: 3000/tcp) | `frontend_net`, `backend_net` |
| **db** | `postgres:17-alpine` | Cơ sở dữ liệu quan hệ PostgreSQL 17 (Cổng nội bộ: 5432/tcp) | `backend_net` (internal: true) |
| **pgadmin** | `dpage/pgadmin4:latest` | Giao diện web quản trị CSDL PostgreSQL (Cổng nội bộ: 80/tcp, proxy qua 5050) | `frontend_net`, `backend_net` |
| **prometheus** | `prom/prometheus:latest` | Máy chủ thu thập & lưu trữ metrics hệ thống (Cổng nội bộ: 9090/tcp) | `monitoring_net` |
| **grafana** | `grafana/grafana:latest` | Dashboard trực quan hóa chỉ số & Quản lý cảnh báo (Cổng nội bộ: 3000/tcp, map 3001) | `monitoring_net` |
| **cadvisor** | `gcr.io/cadvisor/cadvisor:latest` | Thu thập chỉ số CPU, RAM, Network I/O từ cgroups (Cổng nội bộ: 8080/tcp) | `monitoring_net` |
| **nginx_exporter** | `nginx/nginx-prometheus-exporter:1.1.0` | Thu thập metrics hiệu năng từ Nginx stub_status (Cổng nội bộ: 9113/tcp) | `monitoring_net` |
| **postgres_exporter** | `prometheuscommunity/postgres-exporter:v0.15.0` | Thu thập metrics hiệu năng CSDL PostgreSQL (Cổng nội bộ: 9187/tcp) | `backend_net`, `monitoring_net` |
| **loki** | `grafana/loki:2.9.8` | Cụm lưu trữ và lập chỉ mục Log tập trung (Cổng nội bộ: 3100/tcp) | `monitoring_net` |
| **promtail** | `grafana/promtail:latest` | Thu thập log container từ Docker daemon gửi về Loki | `monitoring_net` |

---

## 3. Yêu cầu hệ thống
- **Hệ điều hành:** Ubuntu Server 22.04 LTS / 24.04 LTS (khuyến nghị kiến trúc x86_64).
- **Phần cứng tối thiểu:**
  - CPU: 2 Cores trở lên.
  - RAM: 4 GB trở lên (đáp ứng vận hành ổn định cho toàn bộ stack App, DB, Prometheus, Grafana và Loki).
  - Ổ đĩa: Tối thiểu 20 GB dung lượng trống.
- **Công cụ cài đặt sẵn:**
  - Docker Engine 24.0+ và Docker Compose Plugin v2 (`docker compose`).
  - Git, OpenSSL, cURL, OpenSSH.

---

## 4. Hướng dẫn khởi chạy hệ thống
Triển khai hệ thống trên máy chủ Ubuntu theo trình tự chuẩn hóa các bước dưới đây:

```bash
# Bước 1: Sao chép mã nguồn dự án từ GitHub
git clone [https://github.com/vanthai02032006/dtc245200867-he-thong-quan-ly-thu-vien.git](https://github.com/vanthai02032006/dtc245200867-he-thong-quan-ly-thu-vien.git)

# Bước 2: Di chuyển vào thư mục dự án
cd dtc245200867-he-thong-quan-ly-thu-vien

# Bước 3: Tạo tệp cấu hình biến môi trường và thiết lập phân quyền an toàn
cp .env.example .env
chmod 600 .env
nano .env   # Điền các giá trị mật khẩu bí mật an toàn

# Bước 4: Khởi tạo chứng chỉ SSL tự ký cho Nginx HTTPS
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/thuvien.key \
  -out nginx/ssl/thuvien.crt \
  -subj "/C=VN/ST=ThaiNguyen/O=ICTU/CN=localhost"

# Bước 5: Khởi chạy toàn bộ hệ thống dịch vụ bằng Docker Compose
docker compose up -d --build

# Bước 6: Kiểm tra trạng thái toàn bộ container hoạt động bình thường
docker compose ps
5. Địa chỉ truy cập dịch vụ
Hệ thống được thiết kế theo mô hình phòng thủ bảo mật chuyên sâu, chỉ mở duy nhất cổng Nginx (80/443) và cổng quản trị ra bên ngoài host:

Ứng dụng Web Quản lý thư viện: https://<IP_MAY_CHU>/

(Ví dụ: https://localhost/ hoặc https://192.168.49.128/ - Tài khoản mặc định: admin, mật khẩu lấy theo biến cấu hình).

pgAdmin 4 (Quản trị CSDL): http://<IP_MAY_CHU>:5050

Tài khoản: Cấu hình qua PGADMIN_DEFAULT_EMAIL và PGADMIN_DEFAULT_PASSWORD.

Kết nối DB: Host db, Port 5432, Database library_db, User library_user.

Grafana Dashboard: http://<IP_MAY_CHU>:3001

(Tài khoản: admin, mật khẩu cấu hình qua biến GRAFANA_ADMIN_PASSWORD).

Prometheus UI: http://<IP_MAY_CHU>:9090 (Kiểm tra targets cào dữ liệu tại /targets).

6. Nghiệp vụ Quản lý Thư viện
Hệ thống hỗ trợ đầy đủ luồng nghiệp vụ quản lý tài nguyên và bạn đọc:

Xác thực & Phân quyền: Phân quyền Quản trị viên (Admin) và Thủ thư/Bạn đọc. Bắt buộc đăng nhập trước khi thao tác các tính năng tra cứu, mượn trả.

Quản lý Danh mục Sách: Khởi tạo danh mục đầu sách, phân loại thể loại, tác giả, nhà xuất bản, năm xuất bản và kiểm soát số lượng sách trong kho.

Mượn & Trả sách: Theo dõi thông tin độc giả mượn sách, ngày mượn, hạn trả và tự động tính toán trạng thái quá hạn.

Toàn vẹn dữ liệu (Transaction): Ứng dụng sử dụng PostgreSQL Transactions để đảm bảo việc cập nhật số lượng tồn kho đầu sách khi mượn/trả diễn ra chính xác tuyệt đối, tránh hiện tượng Race Condition.

7. Giám sát hiệu năng và Quản lý Log tập trung
Giám sát số liệu (Metrics Monitoring):

Prometheus tự động cào dữ liệu định kỳ 15 giây/lần từ các targets: cadvisor (tài nguyên container), nginx_exporter (kết nối và lưu lượng Nginx), postgres_exporter (tải truy vấn DB) và prometheus.

Grafana tích hợp sẵn các Dashboards giám sát tài nguyên CPU/RAM, số kết nối hoạt động và tỷ lệ request mạng.

Quản lý Log tập trung (Centralized Logging - Loki & Promtail):

Promtail tự động lắng nghe socket /var/run/docker.sock, bóc tách tên container làm nhãn truy vấn (container, service) và ship log về cụm lưu trữ Loki.

4 câu truy vấn LogQL mẫu phục vụ điều tra và vận hành:

Truy vấn toàn bộ luồng log ứng dụng Web:

{container=~".*web.*"}

Lọc thông điệp cảnh báo, ngoại lệ và lỗi ứng dụng:

{container=~".*web.*"} |~ "(?i)(error|exception|failed)"

Truy vết các sự kiện đăng nhập thất bại (kèm IP nguồn và tài khoản):

{container=~".*web.*"} |= "LOGIN_FAILED"

Thống kê tần suất đăng nhập lỗi phục vụ luật cảnh báo Alerting:

sum(count_over_time({container=~".*web.*"} |= "LOGIN_FAILED" [1m]))

8. Kịch bản sự cố Brute-Force, Cảnh báo và Phòng vệ tự động
Hành vi tấn công: Script tự động (PowerShell/Bash) gửi dồn dập các yêu cầu HTTP POST thử sai mật khẩu vào endpoint xác thực /api/auth/login.

Cơ chế phát hiện tự động: Grafana Alerting định kỳ quét biểu thức LogQL. Khi tần suất lỗi LOGIN_FAILED vượt ngưỡng cho phép, Alert Rule Library - Brute force login detected lập tức chuyển từ trạng thái Pending sang Firing màu đỏ.

Truy vết & Điều tra số: Kỹ sư vận hành sử dụng LogQL trên Grafana Explore mở rộng dòng log để trích xuất IP nguồn, thời điểm tấn công và tài khoản mục tiêu.

Ngăn chặn chủ động (Rate Limiting): Nginx cấu hình module limit_req (zone=login_limit:10m rate=1r/s nodelay; limit_req_status 429;), lập tức từ chối và trả về mã trạng thái HTTP/1.1 429 Too Many Requests ngay từ tầng proxy ngoài cùng, bảo vệ an toàn cho container Web và CSDL.

9. 6 Biện pháp Hardening tăng cường an toàn hệ thống
BP1 – Phân đoạn mạng Docker (Network Segmentation): Tách hệ thống thành 3 mạng bridge độc lập (frontend_net, backend_net, monitoring_net). CSDL PostgreSQL đặt hoàn toàn trong backend_net với internal: true, tuyệt đối không bind cổng 5432 ra bên ngoài máy chủ host; chỉ duy nhất Nginx mở cổng 80/443.

BP2 – Quản lý bí mật qua tệp .env (Secrets Management): Toàn bộ mật khẩu, thông tin chuỗi kết nối lưu trong tệp .env phân quyền chmod 600, khai báo trong .gitignore và không bị Git theo dõi. Dự án cung cấp tệp mẫu .env.example không chứa dữ liệu nhạy cảm.

BP3 – Phân quyền tối thiểu cho CSDL (Least Privilege): Ứng dụng kết nối qua tài khoản người dùng riêng biệt; tài khoản giám sát monitoring_user chỉ được cấp vai trò đọc số liệu thống kê (pg_monitor). Mọi thao tác nguy hiểm như DROP TABLE của user giám sát đều bị hệ quản trị CSDL từ chối thẳng thừng.

BP4 – Chạy Container với quyền tối thiểu (Least Privilege & Resource Limits): Kích hoạt security_opt: ["no-new-privileges:true"], loại bỏ capabilities dư thừa (cap_drop: [ALL]), thiết lập hệ thống tệp chỉ đọc (read_only: true) cho Nginx và giới hạn hạn mức tài nguyên CPU/RAM (limits.cpus, limits.memory) chống cạn kiệt tài nguyên máy chủ.

BP5 – Hardening Ứng dụng & Nginx Web Server: Ẩn phiên bản máy chủ (server_tokens off), bổ sung đầy đủ bộ Security Headers (Strict-Transport-Security, X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff), chỉ cho phép các giao thức bảo mật cao TLSv1.2 và TLSv1.3, kiểm soát chặn truy cập bên ngoài vào các endpoint /stub_status.

BP6 – Tường lửa UFW trên Máy chủ Host: Áp dụng chính sách mặc định từ chối toàn bộ kết nối đến (default deny incoming), chỉ mở các cổng dịch vụ thiết yếu: 22 (SSH), 80 (HTTP) và 443 (HTTPS).

10. Cấu trúc thư mục dự án
Plaintext
dtc245200867-he-thong-quan-ly-thu-vien/
├── docker-compose.yml          # Tệp điều phối chính toàn bộ dịch vụ và mạng nội bộ
├── .env.example                # Tệp mẫu biến môi trường an toàn
├── .gitignore                  # Loại trừ tệp bí mật (.env, private keys, log)
├── README.md                   # Tài liệu hướng dẫn triển khai và kiến trúc hệ thống
├── db/
│   └── init.sql                # Script khởi tạo bảng dữ liệu và tài khoản CSDL
├── nginx/
│   ├── nginx.conf              # Cấu hình Reverse Proxy, HTTPS, Security Headers, Rate Limit
│   └── ssl/                    # Thư mục chứa chứng chỉ thuvien.crt và khóa thuvien.key
├── web/
│   ├── Dockerfile              # Dockerfile đóng gói ứng dụng web Node.js
│   ├── package.json            # Quản lý thư viện phụ thuộc của ứng dụng
│   └── server.js               # Mã nguồn ứng dụng Web thư viện và ghi log xác thực
├── prometheus/
│   └── prometheus.yml          # Cấu hình Scrape Targets cho Prometheus
├── grafana/
│   └── provisioning/           # Nạp sẵn Datasources (Prometheus, Loki) và Dashboards
├── loki/
│   └── loki-config.yaml        # Cấu hình lưu trữ và phân vùng log của Loki
├── promtail/
│   └── promtail-config.yaml    # Cấu hình thu thập log Docker socket đẩy về Loki
├── scripts/
│   └── hardening_evidence.sh   # Kịch bản tự động kiểm tra và in bằng chứng 6 biện pháp Hardening
└── docs/
    └── su-co-bruteforce.md      # Tài liệu kịch bản mô phỏng tấn công, Alerting và LogQL
