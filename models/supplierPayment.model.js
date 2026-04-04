const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    voucherNo: {                 // ✅ NEW FIELD
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank', 'Online'],
      default: 'Cash'
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }, { timestamps: true });

  module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
