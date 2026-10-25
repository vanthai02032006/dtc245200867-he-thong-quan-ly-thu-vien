const { pool, dbState, memoryStore } = require('../config/db');
const env = require('../config/env');

const metrics = {
  httpRequestsTotal: 0,
  httpErrorsTotal: 0,
  loanActionsTotal: 0,
  authLoginsTotal: 0,
};

class SystemService {
  static async getHealth() {
    const studentTag = `${env.STUDENT_INFO.fullName} - ${env.STUDENT_INFO.studentId} - ${env.STUDENT_INFO.className}`;
    if (dbState.storageMode === 'memory') {
      return {
        status: 'ok',
        application: 'library-management-system',
        student: studentTag,
        mode: 'in-memory-local-demo',
      };
    }
    await pool.query('SELECT 1');
    return {
      status: 'ok',
      application: 'library-management-system',
      student: studentTag,
      database: 'postgresql-connected',
    };
  }

  static async getStats() {
    if (dbState.storageMode === 'memory') {
      const now = Date.now();
      return {
        titles: memoryStore.books.length,
        totalCopies: memoryStore.books.reduce((s, b) => s + b.quantity, 0),
        availableCopies: memoryStore.books.reduce((s, b) => s + b.available, 0),
        totalReaders: memoryStore.readers.length,
        activeLoans: memoryStore.loans.filter((l) => l.status === 'BORROWED').length,
        returnedLoans: memoryStore.loans.filter((l) => l.status === 'RETURNED').length,
        overdueLoans: memoryStore.loans.filter(
          (l) => l.status === 'BORROWED' && new Date(l.due_date).getTime() < now
        ).length,
      };
    }

    const books = await pool.query(
      'SELECT COUNT(*) AS titles, COALESCE(SUM(quantity), 0) AS total_copies, COALESCE(SUM(available), 0) AS available_copies FROM books'
    );
    const readers = await pool.query('SELECT COUNT(*) AS total_readers FROM readers');
    const loans = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'BORROWED') AS active_loans,
        COUNT(*) FILTER (WHERE status = 'RETURNED') AS returned_loans,
        COUNT(*) FILTER (WHERE status = 'BORROWED' AND due_date < NOW()) AS overdue_loans
      FROM loans
    `);

    return {
      titles: Number(books.rows[0].titles),
      totalCopies: Number(books.rows[0].total_copies),
      availableCopies: Number(books.rows[0].available_copies),
      totalReaders: Number(readers.rows[0].total_readers),
      activeLoans: Number(loans.rows[0].active_loans),
      returnedLoans: Number(loans.rows[0].returned_loans),
      overdueLoans: Number(loans.rows[0].overdue_loans),
    };
  }

  static async getPrometheusMetrics() {
    let totalBooks = 0;
    let availBooks = 0;
    let totalReaders = 0;
    let activeLoans = 0;

    if (dbState.storageMode === 'postgres') {
      const booksCount = await pool.query('SELECT COUNT(*) as total, COALESCE(SUM(available),0) as avail FROM books');
      const readersCount = await pool.query('SELECT COUNT(*) as total FROM readers');
      const loansCount = await pool.query("SELECT COUNT(*) as total FROM loans WHERE status = 'BORROWED'");
      totalBooks = booksCount.rows[0].total;
      availBooks = booksCount.rows[0].avail;
      totalReaders = readersCount.rows[0].total;
      activeLoans = loansCount.rows[0].total;
    } else {
      totalBooks = memoryStore.books.length;
      availBooks = memoryStore.books.reduce((s, b) => s + b.available, 0);
      totalReaders = memoryStore.readers.length;
      activeLoans = memoryStore.loans.filter((l) => l.status === 'BORROWED').length;
    }

    return [
      '# HELP library_http_requests_total Total number of HTTP requests',
      '# TYPE library_http_requests_total counter',
      `library_http_requests_total ${metrics.httpRequestsTotal}`,
      '# HELP library_http_errors_total Total number of HTTP 5xx errors',
      '# TYPE library_http_errors_total counter',
      `library_http_errors_total ${metrics.httpErrorsTotal}`,
      '# HELP library_auth_logins_total Total successful logins',
      '# TYPE library_auth_logins_total counter',
      `library_auth_logins_total ${metrics.authLoginsTotal}`,
      '# HELP library_books_total Total book titles in library',
      '# TYPE library_books_total gauge',
      `library_books_total ${totalBooks}`,
      '# HELP library_books_available_total Total available book copies',
      '# TYPE library_books_available_total gauge',
      `library_books_available_total ${availBooks}`,
      '# HELP library_readers_total Total registered readers',
      '# TYPE library_readers_total gauge',
      `library_readers_total ${totalReaders}`,
      '# HELP library_active_loans_total Total currently borrowed books',
      '# TYPE library_active_loans_total gauge',
      `library_active_loans_total ${activeLoans}`,
      '',
    ].join('\n');
  }
}

module.exports = {
  SystemService,
  metrics,
};
