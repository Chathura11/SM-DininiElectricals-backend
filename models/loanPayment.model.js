const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
  receiptNo: { type: String, unique: true }, // ✅ NEW

  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerLoan',
    required: true
  },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online'],
    default: 'Cash'
  },
  reference: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('LoanPayment', loanPaymentSchema);