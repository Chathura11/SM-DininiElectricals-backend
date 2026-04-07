const CustomerLoan = require('../models/customerLoan.model.js');
const LoanPayment = require('../models/loanPayment.model.js');
const Account = require('../models/account.model.js');
const JournalEntry = require('../models/journal.model.js');
const SalesTransaction = require('../models/salesTransaction.model.js');

exports.makePayment = async ({ loanId, amount, paymentMethod, userId }) => {

    const loan = await CustomerLoan.findById(loanId);
    if (!loan) throw new Error('Loan not found');
  
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid payment amount');
    }

    if (numericAmount > loan.balanceAmount) {
      throw new Error('Payment exceeds balance');
    }
  
    // ✅ Generate receipt
    const receiptNo = await generateReceiptNo();

    
  
    const payment = await LoanPayment.create({
      receiptNo,
      loan: loanId,
      amount: numericAmount,
      paymentMethod,
      createdBy: userId
    });
  
    // ================= LOAN UPDATE =================
    loan.paidAmount += numericAmount;
    loan.balanceAmount -= numericAmount;
  
    let isCompleted = false;
  
    if (loan.balanceAmount === 0) {
      loan.status = 'Completed';
      isCompleted = true;
    } else {
      loan.status = 'Partially Paid';
    }
  
    await loan.save();
  
    // ================= 🔥 UPDATE SALES TRANSACTION =================
    if (isCompleted) {
      await SalesTransaction.findByIdAndUpdate(
        loan.transaction,
        { status: 'Completed' }
      );
    }
  
    // ================= ACCOUNTING =================
    const cash = await Account.findOne({ name: paymentMethod === 'Cash' ? 'Cash' : 'Bank' });
    const receivable = await Account.findOne({ name: 'Accounts Receivable' });
  
    if (!cash || !receivable) {
      throw new Error('Accounts not found');
    }
  
    cash.balance += numericAmount;
    receivable.balance -= numericAmount;
  
    await Promise.all([cash.save(), receivable.save()]);
  
    await JournalEntry.create({
      description: `Loan Payment - ${loan.customerName}`,
      debit: { account: cash._id, amount },
      credit: { account: receivable._id, amount }
    });
  
    return payment;
  };

exports.getLoans = async () => {
  return await CustomerLoan.find()
    .populate('transaction')
    .sort({ createdAt: -1 });
};

exports.getLoanPayments = async (loanId) => {
  return await LoanPayment.find({ loan: loanId })
    .sort({ createdAt: -1 });
};


async function generateReceiptNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
  
    // ✅ Get last receipt of this month ONLY
    const lastPayment = await LoanPayment.findOne({
      receiptNo: new RegExp(`^RCPT-${yearMonth}`)
    })
      .sort({ createdAt: -1 })
      .lean();
  
    let seq = 1;
  
    if (lastPayment && lastPayment.receiptNo) {
      const lastSeq = parseInt(lastPayment.receiptNo.split('-')[2], 10);
      seq = lastSeq + 1;
    }
  
    const seqStr = String(seq).padStart(4, '0');
    return `RCPT-${yearMonth}-${seqStr}`;
  }