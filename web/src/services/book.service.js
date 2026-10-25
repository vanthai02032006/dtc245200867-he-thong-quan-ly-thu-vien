const BookModel = require('../models/book.model');

class BookService {
  static async getBooks(search) {
    return BookModel.findAll(search);
  }

  static async createBook({ title, author, category, quantity }) {
    const qty = Math.max(1, Number(quantity) || 1);
    const cat = category || 'Công nghệ thông tin';
    const book = await BookModel.create({ title, author, category: cat, quantity: qty });
    console.log(`[BOOK_CREATED] Added book "${title}" (qty: ${qty})`);
    return book;
  }

  static async deleteBook(id) {
    await BookModel.deleteById(Number(id));
    console.log(`[BOOK_DELETED] Deleted book ID=${id}`);
    return { message: 'Đã xóa sách thành công' };
  }
}

module.exports = BookService;
