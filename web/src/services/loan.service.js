const LoanModel = require('../models/loan.model');
const { metrics } = require('./system.service');

class LoanService {
  static async getLoans() {
    return LoanModel.findAll();
  }

  static async borrowBook({ book_id, reader_id, days }) {
    const loanDays = Math.max(1, Number(days) || 14);
    const loan = await LoanModel.createLoan({ book_id, reader_id, loanDays });
    metrics.loanActionsTotal++;
    console.log(`[LOAN_BORROW] Book ID=${book_id} borrowed by Reader ID=${reader_id} for ${loanDays} days`);
    return loan;
  }

  static async returnBook(id) {
    const loan = await LoanModel.returnLoan(Number(id));
    metrics.loanActionsTotal++;
    console.log(`[LOAN_RETURN] Loan ID=${id} (Book ID=${loan.book_id}) returned successfully`);
    return { message: 'Đã ghi nhận trả sách thành công' };
  }
}

module.exports = LoanService;
