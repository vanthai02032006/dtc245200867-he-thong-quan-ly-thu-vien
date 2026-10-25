const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  connectionTimeoutMillis: 2500,
});

const dbState = {
  storageMode: 'postgres', // 'postgres' | 'memory'
};

// Dữ liệu mẫu In-Memory khi chạy demo local không bật PostgreSQL container
const memoryStore = {
  users: [
    { id: 1, username: 'admin', password: '123', full_name: 'Cấn Văn Thái (DTC245200867)', role: 'QUẢN TRỊ VIÊN' },
    { id: 2, username: 'dtc245200867', password: '123', full_name: 'Cấn Văn Thái - CNTT-K23C', role: 'QUẢN TRỊ VIÊN' },
    { id: 3, username: 'thuthu', password: '123', full_name: 'Thủ thư ICTU', role: 'THỦ THƯ' },
  ],
  books: [
    { id: 1, title: 'Lập trình Node.js & Express Nâng cao', author: 'Nguyễn Văn A', category: 'Lập trình', quantity: 5, available: 4, created_at: new Date().toISOString() },
    { id: 2, title: 'Cơ sở dữ liệu PostgreSQL 17 Thực chiến', author: 'Trần Văn B', category: 'Cơ sở dữ liệu', quantity: 3, available: 3, created_at: new Date().toISOString() },
    { id: 3, title: 'Triển khai & Quản trị Hệ thống với Docker', author: 'Lê Văn C', category: 'DevOps & Cloud', quantity: 4, available: 3, created_at: new Date().toISOString() },
    { id: 4, title: 'Giám sát Hệ thống với Prometheus, Grafana & Loki', author: 'Phạm Thị D', category: 'DevSecOps', quantity: 3, available: 3, created_at: new Date().toISOString() },
    { id: 5, title: 'Bảo mật Mạng & Cấu hình Nginx Reverse Proxy', author: 'Hoàng Văn E', category: 'An toàn thông tin', quantity: 2, available: 2, created_at: new Date().toISOString() },
  ],
  readers: [
    { id: 1, name: 'Cấn Văn Thái', email: 'dtc245200867@ictu.edu.vn', phone: '0988123456', card_code: 'DTC245200867', created_at: new Date().toISOString() },
    { id: 2, name: 'Hoàng Minh Tuấn', email: 'tuan.hm@ictu.edu.vn', phone: '0901234567', card_code: 'TV-2026-001', created_at: new Date().toISOString() },
    { id: 3, name: 'Nguyễn Thị Lan Anh', email: 'lananh.nt@ictu.edu.vn', phone: '0912345678', card_code: 'TV-2026-002', created_at: new Date().toISOString() },
    { id: 4, name: 'Đặng Quốc Bảo', email: 'bao.dq@ictu.edu.vn', phone: '0987654321', card_code: 'TV-2026-003', created_at: new Date().toISOString() },
  ],
  loans: [
    {
      id: 1,
      book_id: 1,
      reader_id: 1,
      borrow_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      due_date: new Date(Date.now() + 12 * 86400000).toISOString(),
      return_date: null,
      status: 'BORROWED',
    },
    {
      id: 2,
      book_id: 3,
      reader_id: 2,
      borrow_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      due_date: new Date(Date.now() + 9 * 86400000).toISOString(),
      return_date: null,
      status: 'BORROWED',
    },
    {
      id: 3,
      book_id: 2,
      reader_id: 3,
      borrow_date: new Date(Date.now() - 10 * 86400000).toISOString(),
      due_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      return_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: 'RETURNED',
    },
  ],
  nextUserId: 4,
  nextBookId: 6,
  nextReaderId: 5,
  nextLoanId: 4,
};

async function initDatabase() {
  const maxRetries = env.DB.HAS_EXPLICIT_HOST ? 8 : 1;
  let retries = maxRetries;

  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(200) NOT NULL,
          full_name VARCHAR(150) NOT NULL,
          role VARCHAR(50) DEFAULT 'QUẢN TRỊ VIÊN',
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
      `);

      await pool.query(`
        ALTER TABLE books ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Công nghệ thông tin';
        ALTER TABLE books ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE books ADD COLUMN IF NOT EXISTS available INTEGER NOT NULL DEFAULT 1;
      `);

      await pool.query(`
        INSERT INTO users (username, password, full_name, role) VALUES
          ('admin', '123', 'Cấn Văn Thái (DTC245200867)', 'QUẢN TRỊ VIÊN'),
          ('dtc245200867', '123', 'Cấn Văn Thái - CNTT-K23C', 'QUẢN TRỊ VIÊN')
        ON CONFLICT (username) DO NOTHING;
      `);

      const bookCount = await pool.query('SELECT COUNT(*) FROM books');
      if (Number(bookCount.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO books (title, author, category, quantity, available) VALUES
            ('Lập trình Node.js & Express Nâng cao', 'Nguyễn Văn A', 'Lập trình', 5, 4),
            ('Cơ sở dữ liệu PostgreSQL 17 Thực chiến', 'Trần Văn B', 'Cơ sở dữ liệu', 3, 3),
            ('Triển khai & Quản trị Hệ thống với Docker', 'Lê Văn C', 'DevOps & Cloud', 4, 3),
            ('Giám sát Hệ thống với Prometheus, Grafana & Loki', 'Phạm Thị D', 'DevSecOps', 3, 3),
            ('Bảo mật Mạng & Cấu hình Nginx Reverse Proxy', 'Hoàng Văn E', 'An toàn thông tin', 2, 2);
        `);
      }

      const readerCount = await pool.query('SELECT COUNT(*) FROM readers');
      if (Number(readerCount.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO readers (name, email, phone, card_code) VALUES
            ('Cấn Văn Thái', 'dtc245200867@ictu.edu.vn', '0988123456', 'DTC245200867'),
            ('Hoàng Minh Tuấn', 'tuan.hm@ictu.edu.vn', '0901234567', 'TV-2026-001'),
            ('Nguyễn Thị Lan Anh', 'lananh.nt@ictu.edu.vn', '0912345678', 'TV-2026-002'),
            ('Đặng Quốc Bảo', 'bao.dq@ictu.edu.vn', '0987654321', 'TV-2026-003');
        `);

        const booksRes = await pool.query('SELECT id FROM books ORDER BY id LIMIT 2');
        const readersRes = await pool.query('SELECT id FROM readers ORDER BY id LIMIT 2');
        if (booksRes.rows.length >= 2 && readersRes.rows.length >= 2) {
          await pool.query(
            `INSERT INTO loans (book_id, reader_id, borrow_date, due_date, status) VALUES
              ($1, $2, NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 days', 'BORROWED'),
              ($3, $4, NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', 'BORROWED')`,
            [booksRes.rows[0].id, readersRes.rows[0].id, booksRes.rows[1].id, readersRes.rows[1].id]
          );
        }
      }

      dbState.storageMode = 'postgres';
      console.log('[INFO] PostgreSQL database connected and verified successfully.');
      return;
    } catch (err) {
      retries--;
      if (retries > 0) {
        console.warn(`[WARN] Waiting for PostgreSQL database... (${retries} retries left):`, err.message);
        await new Promise((r) => setTimeout(r, 2500));
      } else {
        dbState.storageMode = 'memory';
        console.warn('[WARN] PostgreSQL not reachable on local machine. Running in In-Memory Demo Mode with sample data.');
      }
    }
  }
}

module.exports = {
  pool,
  dbState,
  memoryStore,
  initDatabase,
};
