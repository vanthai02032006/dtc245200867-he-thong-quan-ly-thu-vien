const { pool, dbState, memoryStore } = require('../config/db');
const AppError = require('../utils/AppError');

class LoanModel {
  static async findAll() {
    if (dbState.storageMode === 'memory') {
      return memoryStore.loans
        .map((l) => {
          const b = memoryStore.books.find((x) => x.id === l.book_id) || { title: 'Sách đã xóa', author: '' };
          const r = memoryStore.readers.find((x) => x.id === l.reader_id) || { name: 'Độc giả đã xóa', card_code: '' };
          return {
            ...l,
            book_title: b.title,
            book_author: b.author,
            reader_name: r.name,
            reader_card: r.card_code,
          };
        })
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'BORROWED' ? -1 : 1;
          return new Date(b.borrow_date) - new Date(a.borrow_date);
        });
    }

    const result = await pool.query(`
      SELECT l.id, l.book_id, l.reader_id, l.borrow_date, l.due_date, l.return_date, l.status,
             b.title AS book_title, b.author AS book_author,
             r.name AS reader_name, r.card_code AS reader_card
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN readers r ON l.reader_id = r.id
      ORDER BY
        CASE WHEN l.status = 'BORROWED' THEN 0 ELSE 1 END,
        l.borrow_date DESC
    `);
    return result.rows;
  }

  static async createLoan({ book_id, reader_id, loanDays }) {
    if (dbState.storageMode === 'memory') {
      const book = memoryStore.books.find((b) => b.id === Number(book_id));
      if (!book) throw new AppError('Không tìm thấy sách', 404);
      if (book.available <= 0) throw new AppError('Sách này hiện đã hết bản có sẵn trong kho!', 400);

      book.available -= 1;
      const newLoan = {
        id: memoryStore.nextLoanId++,
        book_id: Number(book_id),
        reader_id: Number(reader_id),
        borrow_date: new Date().toISOString(),
        due_date: new Date(Date.now() + loanDays * 86400000).toISOString(),
        return_date: null,
        status: 'BORROWED',
      };
      memoryStore.loans.push(newLoan);
      return newLoan;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const bookRes = await client.query(
        'SELECT id, title, available FROM books WHERE id = $1 FOR UPDATE',
        [book_id]
      );
      if (bookRes.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Không tìm thấy sách', 404);
      }
      if (bookRes.rows[0].available <= 0) {
        await client.query('ROLLBACK');
        throw new AppError('Sách này hiện đã hết bản có sẵn trong kho!', 400);
      }

      await client.query('UPDATE books SET available = available - 1 WHERE id = $1', [book_id]);
      const loanRes = await client.query(
        `INSERT INTO loans (book_id, reader_id, borrow_date, due_date, status)
         VALUES ($1, $2, NOW(), NOW() + ($3 || ' days')::INTERVAL, 'BORROWED')
         RETURNING *`,
        [book_id, reader_id, loanDays]
      );

      await client.query('COMMIT');
      return loanRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async returnLoan(id) {
    if (dbState.storageMode === 'memory') {
      const loan = memoryStore.loans.find((l) => l.id === id);
      if (!loan) throw new AppError('Không tìm thấy phiếu mượn', 404);
      if (loan.status === 'RETURNED') throw new AppError('Phiếu mượn này đã được trả trước đó', 400);

      loan.status = 'RETURNED';
      loan.return_date = new Date().toISOString();
      const book = memoryStore.books.find((b) => b.id === loan.book_id);
      if (book) book.available = Math.min(book.quantity, book.available + 1);
      return loan;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const loanRes = await client.query('SELECT * FROM loans WHERE id = $1 FOR UPDATE', [id]);
      if (loanRes.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Không tìm thấy phiếu mượn', 404);
      }
      const loan = loanRes.rows[0];
      if (loan.status === 'RETURNED') {
        await client.query('ROLLBACK');
        throw new AppError('Phiếu mượn này đã được trả trước đó', 400);
      }

      await client.query(
        `UPDATE loans SET status = 'RETURNED', return_date = NOW() WHERE id = $1`,
        [id]
      );
      await client.query(
        `UPDATE books SET available = LEAST(quantity, available + 1) WHERE id = $1`,
        [loan.book_id]
      );

      await client.query('COMMIT');
      return loan;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = LoanModel;
