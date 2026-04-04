const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  voucherNo: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['Salary Expense', 'Additional Expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidFrom: {
    type: String, // Cash / Bank / etc
    required: true
  },
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);