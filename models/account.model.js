const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Asset', 'Liability', 'Revenue', 'Expense'], required: true },
  balance: { type: Number, default: 0 }
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;