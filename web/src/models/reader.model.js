const { pool, dbState, memoryStore } = require('../config/db');

class ReaderModel {
  static async findAll() {
    if (dbState.storageMode === 'memory') {
      return memoryStore.readers
        .map((r) => ({
          ...r,
          borrowing_count: memoryStore.loans.filter(
            (l) => l.reader_id === r.id && l.status === 'BORROWED'
          ).length,
        }))
        .sort((a, b) => b.id - a.id);
    }

    const result = await pool.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM loans l WHERE l.reader_id = r.id AND l.status = 'BORROWED') AS borrowing_count
      FROM readers r
      ORDER BY r.id DESC
    `);
    return result.rows;
  }

  static async create({ name, email, phone, card_code }) {
    if (dbState.storageMode === 'memory') {
      const exists = memoryStore.readers.some(
        (r) => r.email === email.trim() || r.card_code === card_code
      );
      if (exists) {
        const err = new Error('Email hoặc Mã thẻ thư viện đã tồn tại');
        err.code = '23505';
        throw err;
      }
      const newReader = {
        id: memoryStore.nextReaderId++,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        card_code,
        created_at: new Date().toISOString(),
      };
      memoryStore.readers.push(newReader);
      return newReader;
    }

    const result = await pool.query(
      `INSERT INTO readers (name, email, phone, card_code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), email.trim(), phone.trim(), card_code]
    );
    return result.rows[0];
  }

  static async deleteById(id) {
    if (dbState.storageMode === 'memory') {
      memoryStore.readers = memoryStore.readers.filter((r) => r.id !== id);
      memoryStore.loans = memoryStore.loans.filter((l) => l.reader_id !== id);
      return true;
    }
    await pool.query('DELETE FROM readers WHERE id = $1', [id]);
    return true;
  }
}

module.exports = ReaderModel;
