const { pool, dbState, memoryStore } = require('../config/db');

class BookModel {
  static async findAll(searchQuery = '') {
    if (dbState.storageMode === 'memory') {
      const q = searchQuery.toLowerCase().trim();
      return memoryStore.books
        .filter(
          (b) =>
            !q ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.category || '').toLowerCase().includes(q)
        )
        .slice()
        .sort((a, b) => b.id - a.id);
    }

    const search = searchQuery ? `%${searchQuery}%` : '%';
    const result = await pool.query(
      `SELECT id, title, author, category, quantity, available, created_at
       FROM books
       WHERE title ILIKE $1 OR author ILIKE $1 OR category ILIKE $1
       ORDER BY id DESC`,
      [search]
    );
    return result.rows;
  }

  static async create({ title, author, category, quantity }) {
    if (dbState.storageMode === 'memory') {
      const newBook = {
        id: memoryStore.nextBookId++,
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        quantity,
        available: quantity,
        created_at: new Date().toISOString(),
      };
      memoryStore.books.push(newBook);
      return newBook;
    }

    const result = await pool.query(
      `INSERT INTO books (title, author, category, quantity, available)
       VALUES ($1, $2, $3, $4, $4) RETURNING *`,
      [title.trim(), author.trim(), category.trim(), quantity]
    );
    return result.rows[0];
  }

  static async deleteById(id) {
    if (dbState.storageMode === 'memory') {
      memoryStore.books = memoryStore.books.filter((b) => b.id !== id);
      memoryStore.loans = memoryStore.loans.filter((l) => l.book_id !== id);
      return true;
    }
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    return true;
  }
}

module.exports = BookModel;
