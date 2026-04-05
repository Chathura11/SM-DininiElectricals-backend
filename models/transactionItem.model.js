const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionItemSchema = new Schema({
  transaction: { 
    type: Schema.Types.ObjectId, 
    ref: 'SalesTransaction', 
    required: true 
  },
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  sellingPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  costPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  profit: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('TransactionItem', transactionItemSchema);
