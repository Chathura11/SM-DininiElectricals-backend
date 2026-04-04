const mongoose = require('mongoose');
const SupplierPayment = require('../models/supplierPayment.model');
const Account = require('../models/account.model');
const JournalEntry = require('../models/journal.model');
const StockEntry = require('../models/stockEntry.model');
const moment = require('moment');

exports.makePayment = async ({ supplier, amount, paymentMethod, note }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const payable = await Account.findOne({ name: 'Accounts Payable' }).session(session);
      const cash = await Account.findOne({ name: 'Cash' }).session(session);
  
      if (!payable || !cash) {
        throw new Error('Accounts not found');
      }
  
      const numericAmount = Number(amount);

      // 🚨 VALIDATION
        if (numericAmount <= 0) {
            throw new Error('Invalid payment amount');
        }
        
        if (cash.balance < numericAmount) {
            throw new Error('Insufficient Cash Balance');
        }
  
      // ✅ Generate voucher number
      const voucherNo = await generateVoucherNo();
  
      // ✅ Update accounts
      payable.balance -= numericAmount;
      cash.balance -= numericAmount;
  
      await Promise.all([
        payable.save({ session }),
        cash.save({ session })
      ]);
  
      // ✅ Save payment
      const payment = await SupplierPayment.create([{
        supplier,
        voucherNo,   // ✅ include here
        amount: numericAmount,
        paymentMethod,
        note
      }], { session });
  
      // ✅ Journal Entry
      await JournalEntry.create([{
        description: `Supplier Payment - ${voucherNo}`,
        debit: { account: payable._id, amount: numericAmount },
        credit: { account: cash._id, amount: numericAmount }
      }], { session });
  
      await session.commitTransaction();
      session.endSession();
  
      return payment[0];
  
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  };

  async function generateVoucherNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Jan = 0
    const yearMonth = `${year}${month}`; // e.g., 202604
  
    // Get last payment (latest voucher)
    const lastPayment = await SupplierPayment.findOne()
      .sort({ createdAt: -1 })
      .lean();
  
    let seq = 1; // default for new month
  
    if (lastPayment && lastPayment.voucherNo) {
      const [prefix, lastYearMonth, lastSeq] = lastPayment.voucherNo.split('-'); // PAY-YYYYMM-XXXX
  
      if (lastYearMonth === yearMonth) {
        // Same month → increment
        seq = parseInt(lastSeq, 10) + 1;
      }
      // else → different month → seq stays 1
    }
  
    const seqStr = String(seq).padStart(4, '0');
    return `PAY-${yearMonth}-${seqStr}`;
  }

// supplierPayment.service.js
exports.getAllPayments = async () => {
    return await SupplierPayment.find()
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });
  };

  

  
  exports.getSupplierDue = async (supplierId) => {
    const mongoose = require('mongoose');
  
    const objectId = new mongoose.Types.ObjectId(supplierId);
  
    // ✅ Total Purchases
    const purchases = await StockEntry.aggregate([
      { $match: { supplier: objectId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
  
    // ✅ Total Payments
    const payments = await SupplierPayment.aggregate([
      { $match: { supplier: objectId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
  
    const totalPurchase = purchases[0]?.total || 0;
    const totalPaid = payments[0]?.total || 0;
  
    return totalPurchase - totalPaid;
  };