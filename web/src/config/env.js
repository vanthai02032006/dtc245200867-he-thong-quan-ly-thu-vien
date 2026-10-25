module.exports = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    HOST: process.env.DB_HOST || 'db',
    PORT: Number(process.env.DB_PORT || 5432),
    USER: process.env.DB_USER || 'thuvien_user',
    PASSWORD: process.env.DB_PASSWORD || 'ThuVien123456',
    NAME: process.env.DB_NAME || 'thuvien',
    HAS_EXPLICIT_HOST: Boolean(process.env.DB_HOST),
  },
  STUDENT_INFO: {
    fullName: 'CẤN VĂN THÁI',
    studentId: 'DTC245200867',
    className: 'CNTT-K23C',
    topic: 'Đề 1 - Hệ thống Quản lý Thư viện',
  },
};
