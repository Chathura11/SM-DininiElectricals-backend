const mongoose = require('mongoose');

const customerLoanSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesTransaction',
    required: true
  },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Completed','Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomerLoan', customerLoanSchema);