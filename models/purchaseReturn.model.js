// models/PurchaseReturn.js

const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema(
  {
    stockEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockEntry',
      required: true
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },

    returnDate: {
      type: Date,
      default: Date.now
    },

    totalAmount: {
      type: Number,
      default: 0
    },

    reason: {
      type: String
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);