const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const returnItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  reason: { type: String },
});

const salesReturnSchema = new Schema({
  transaction: { type: Schema.Types.ObjectId, ref: 'SalesTransaction', required: true },
  items: [returnItemSchema],
  returnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  returnedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SalesReturn', salesReturnSchema);
