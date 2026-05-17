// models/PurchaseReturnItem.js

const mongoose = require('mongoose');

const purchaseReturnItemSchema = new mongoose.Schema(
  {
    purchaseReturn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseReturn',
      required: true
    },

    stockEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockEntry'
    },

    stockEntryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockEntryItem',
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    costPrice: {
      type: Number,
      required: true
    },

    amount: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'PurchaseReturnItem',
  purchaseReturnItemSchema
);