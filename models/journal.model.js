const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    description: String,
    debit: {
      account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
      amount: Number
    },
    credit: {
      account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
      amount: Number
    }
  });

module.exports = mongoose.model('JournalEntry', journalSchema);