const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stockEntryItemSchema = new Schema({
    stockEntry: {
      type: Schema.Types.ObjectId,
      ref: 'StockEntry',
      required: true
    },
    product: {
      type: Schema.Types.ObjectId,
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
    }
  }, { timestamps: true });
  

module.exports = mongoose.model('StockEntryItem', stockEntryItemSchema);