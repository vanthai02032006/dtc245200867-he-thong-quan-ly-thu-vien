CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'LIBRARIAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150) NOT NULL,
    category VARCHAR(100) DEFAULT 'Công nghệ thông tin',
    quantity INTEGER NOT NULL DEFAULT 1,
    available INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    card_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    reader_id INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP NULL,
    status VARCHAR(30) DEFAULT 'BORROWED'
);

INSERT INTO users (username, password, full_name, role) VALUES
    ('admin', 'Admin@123', 'Cấn Văn Thái (DTC245200867)', 'QUẢN TRỊ VIÊN'),
    ('thuthu', 'ThuVien@123', 'Thủ thư ICTU', 'THỦ THƯ')
ON CONFLICT (username) DO NOTHING;

INSERT INTO books (title, author, category, quantity, available) VALUES
    ('Lập trình Node.js & Express Nâng cao', 'Nguyễn Văn A', 'Lập trình', 5, 4),
    ('Cơ sở dữ liệu PostgreSQL 17 Thực chiến', 'Trần Văn B', 'Cơ sở dữ liệu', 3, 3),
    ('Triển khai & Quản trị Hệ thống với Docker', 'Lê Văn C', 'DevOps & Cloud', 4, 3),
    ('Giám sát Hệ thống với Prometheus, Grafana & Loki', 'Phạm Thị D', 'DevSecOps', 3, 3),
    ('Bảo mật Mạng & Cấu hình Nginx Reverse Proxy', 'Hoàng Văn E', 'An toàn thông tin', 2, 2);

INSERT INTO readers (name, email, phone, card_code) VALUES
    ('Cấn Văn Thái', 'dtc245200867@ictu.edu.vn', '0988123456', 'DTC245200867'),
    ('Hoàng Minh Tuấn', 'tuan.hm@ictu.edu.vn', '0901234567', 'TV-2026-001'),
    ('Nguyễn Thị Lan Anh', 'lananh.nt@ictu.edu.vn', '0912345678', 'TV-2026-002'),
    ('Đặng Quốc Bảo', 'bao.dq@ictu.edu.vn', '0987654321', 'TV-2026-003');

INSERT INTO loans (book_id, reader_id, borrow_date, due_date, return_date, status) VALUES
    (1, 1, NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 days', NULL, 'BORROWED'),
    (3, 2, NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', NULL, 'BORROWED'),
    (2, 3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', 'RETURNED');
