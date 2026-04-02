const Account = require('../models/account.model.js');
const JournalEntry = require('../models/journal.model.js');

exports.buyStock = async (amount, session = null) => {
  const cash = await Account.findOne({ name: 'Cash' }).session(session);
  const inventory = await Account.findOne({ name: 'Inventory' }).session(session);

  cash.balance -= amount;
  inventory.balance += amount;

  await Promise.all([
    cash.save({ session }),
    inventory.save({ session })
  ]);

  return await JournalEntry.create([{
    description: 'Stock Purchase',
    debit: { account: inventory._id, amount },
    credit: { account: cash._id, amount }
  }], { session });
};

exports.recordSale = async ({ salePrice, costPrice, customerName }) => {
  const cash = await Account.findOne({ name: 'Cash' });
  const inventory = await Account.findOne({ name: 'Inventory' });
  const cogs = await Account.findOne({ name: 'COGS' });
  const sales = await Account.findOne({ name: 'Sales Revenue' });

  const journalEntries = [];

  if (salePrice > 0) {
    // Regular Sale
    cash.balance += salePrice;
    sales.balance += salePrice;

    journalEntries.push({
      description: `Product Sale Revenue - ${customerName}`,
      debit: { account: cash._id, amount: salePrice },
      credit: { account: sales._id, amount: salePrice }
    });
  }

  // Always adjust COGS and Inventory
  inventory.balance -= costPrice;
  cogs.balance += costPrice;

  journalEntries.push({
    description: salePrice > 0 
      ? `Product Cost (COGS) - ${customerName}` 
      : `Free Giveaway - ${customerName}`,
    debit: { account: cogs._id, amount: costPrice },
    credit: { account: inventory._id, amount: costPrice }
  });

  // Save all account updates
  const updates = [inventory.save(), cogs.save()];
  if (salePrice > 0) updates.push(cash.save(), sales.save());
  await Promise.all(updates);

  // Insert journal entries
  return JournalEntry.insertMany(journalEntries);
};


  exports.addMoneyAsset = async ({ amount, source, target,description}) => {

    const numericAmount = Number(amount); // ✅ convert to number

    const sourceAcc = await Account.findOne({ name: source });
    const targetAcc = await Account.findOne({ name: target });
  
    if (!sourceAcc || !targetAcc) throw new Error('Invalid account name');
  
    sourceAcc.balance += numericAmount; // Equity grows
    targetAcc.balance += numericAmount; // Cash grows
  
    await Promise.all([sourceAcc.save(), targetAcc.save()]);
  
    return await JournalEntry.create({
      description,
      debit: { account: targetAcc._id, amount:numericAmount },
      credit: { account: sourceAcc._id, amount:numericAmount }
    });
  };


  exports.addExpense = async ({ amount, category, paidFrom, description }) => {

    const numericAmount = Number(amount); // ✅ convert to number

    const expenseAcc = await Account.findOne({ name: category });
    const paidFromAcc = await Account.findOne({ name: paidFrom });
  
    if (!expenseAcc || !paidFromAcc) throw new Error('Invalid account name');
  
    expenseAcc.balance += numericAmount; // Expense increases
    paidFromAcc.balance -= numericAmount; // Asset (Cash/Bank) decreases
  
    await Promise.all([expenseAcc.save(), paidFromAcc.save()]);
  
    return await JournalEntry.create({
      description: description || `Expense - ${category}`,
      debit: { account: expenseAcc._id, amount:numericAmount },
      credit: { account: paidFromAcc._id, amount:numericAmount }
    });
  };

  exports.getAllAccounts = async () => {
    return await Account.find().sort({ type: 1, name: 1 });
  };

  exports.getAllJournalEntries = async () => {
    return await JournalEntry.find()
      .populate('debit.account')
      .populate('credit.account')
      .sort({ date: -1 });
  };