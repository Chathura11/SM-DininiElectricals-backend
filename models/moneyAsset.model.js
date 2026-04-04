const mongoose = require('mongoose');

const moneyAssetSchema = new mongoose.Schema({
  voucherNo: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String, // Owner Capital / Equity Account
    required: true
  },
  target: {
    type: String, // Cash / Bank
    required: true
  },
  amount: {
    type: Number,
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

module.exports = mongoose.model('MoneyAsset', moneyAssetSchema);