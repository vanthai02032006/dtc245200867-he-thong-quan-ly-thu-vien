const ReaderModel = require('../models/reader.model');
const AppError = require('../utils/AppError');

class ReaderService {
  static async getReaders() {
    return ReaderModel.findAll();
  }

  static async createReader({ name, email, phone, card_code }) {
    const finalCard =
      card_code && card_code.trim() !== ''
        ? card_code.trim()
        : `TV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const reader = await ReaderModel.create({
        name,
        email,
        phone,
        card_code: finalCard,
      });
      console.log(`[READER_CREATED] Registered reader "${name}" (${finalCard})`);
      return reader;
    } catch (err) {
      throw new AppError('Email hoặc Mã thẻ thư viện đã tồn tại', 400);
    }
  }

  static async deleteReader(id) {
    await ReaderModel.deleteById(Number(id));
    console.log(`[READER_DELETED] Deleted reader ID=${id}`);
    return { message: 'Đã xóa độc giả thành công' };
  }
}

module.exports = ReaderService;
