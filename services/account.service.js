const Account = require('../models/account.model.js');
const JournalEntry = require('../models/journal.model.js');
const Expense = require('../models/expense.model');
const MoneyAsset = require('../models/moneyAsset.model');
const SalesTransaction = require('../models/salesTransaction.model');

//before create credit
// exports.buyStock = async (amount, session = null) => {
//   const cash = await Account.findOne({ name: 'Cash' }).session(session);
//   const inventory = await Account.findOne({ name: 'Inventory' }).session(session);

//   cash.balance -= amount;
//   inventory.balance += amount;

//   await Promise.all([
//     cash.save({ session }),
//     inventory.save({ session })
//   ]);

//   return await JournalEntry.create([{
//     description: 'Stock Purchase',
//     debit: { account: inventory._id, amount },
//     credit: { account: cash._id, amount }
//   }], { session });
// };

//after create credit
exports.buyStock = async (amount, session = null, supplierId = null) => {
  const inventory = await Account.findOne({ name: 'Inventory' }).session(session);
  const payable = await Account.findOne({ name: 'Accounts Payable' }).session(session);

  if (!inventory || !payable) {
    throw new Error('Required accounts not found');
  }

  // ✅ Increase inventory
  inventory.balance += amount;

  // ✅ Increase liability
  payable.balance += amount;

  await Promise.all([
    inventory.save({ session }),
    payable.save({ session })
  ]);

  return await JournalEntry.create([{
    description: `Stock Purchase on Credit`,
    debit: { account: inventory._id, amount },
    credit: { account: payable._id, amount }
  }], { session });
};

//old 
// exports.recordSale = async ({ salePrice, costPrice, customerName }) => {
//   const cash = await Account.findOne({ name: 'Cash' });
//   const inventory = await Account.findOne({ name: 'Inventory' });
//   const cogs = await Account.findOne({ name: 'COGS' });
//   const sales = await Account.findOne({ name: 'Sales Revenue' });

//   const journalEntries = [];

//   if (salePrice > 0) {
//     // Regular Sale
//     cash.balance += salePrice;
//     sales.balance += salePrice;

//     journalEntries.push({
//       description: `Product Sale Revenue - ${customerName}`,
//       debit: { account: cash._id, amount: salePrice },
//       credit: { account: sales._id, amount: salePrice }
//     });
//   }

//   // Always adjust COGS and Inventory
//   inventory.balance -= costPrice;
//   cogs.balance += costPrice;

//   journalEntries.push({
//     description: salePrice > 0 
//       ? `Product Cost (COGS) - ${customerName}` 
//       : `Free Giveaway - ${customerName}`,
//     debit: { account: cogs._id, amount: costPrice },
//     credit: { account: inventory._id, amount: costPrice }
//   });

//   // Save all account updates
//   const updates = [inventory.save(), cogs.save()];
//   if (salePrice > 0) updates.push(cash.save(), sales.save());
//   await Promise.all(updates);

//   // Insert journal entries
//   return JournalEntry.insertMany(journalEntries);
// };

//new
exports.recordSale = async ({ salePrice, costPrice, customerName, status,updateInventory}) => {
  const cash = await Account.findOne({ name: 'Cash' });
  const inventory = await Account.findOne({ name: 'Inventory' });
  const cogs = await Account.findOne({ name: 'COGS' });
  const sales = await Account.findOne({ name: 'Sales Revenue' });

  if (!cash || !inventory || !cogs || !sales) {
    throw new Error('Required accounts not found');
  }

  const journalEntries = [];

  // Only update Cash & Sales if status is Completed
  if (status === 'Completed' && salePrice > 0) {
    cash.balance += salePrice;
    sales.balance += salePrice;

    journalEntries.push({
      description: `Product Sale Revenue - ${customerName}`,
      debit: { account: cash._id, amount: salePrice },
      credit: { account: sales._id, amount: salePrice }
    });
  }

  // COGS and Inventory always updated (cost exists regardless of pending or free)
  if(updateInventory){
    inventory.balance -= costPrice;
    cogs.balance += costPrice;

    journalEntries.push({
      description: salePrice > 0
        ? `Product Cost (COGS) - ${customerName}`
        : `Free Giveaway - ${customerName}`,
      debit: { account: cogs._id, amount: costPrice },
      credit: { account: inventory._id, amount: costPrice }
    });
  }

  // Save all account updates
  const updates = [inventory.save(), cogs.save()];
  if (status === 'Completed' && salePrice > 0) {
    updates.push(cash.save(), sales.save());
  }
  await Promise.all(updates);

  // Insert journal entries
  return JournalEntry.insertMany(journalEntries);
};

//old
  // exports.addMoneyAsset = async ({ amount, source, target,description}) => {

  //   const numericAmount = Number(amount); // ✅ convert to number

  //   const sourceAcc = await Account.findOne({ name: source });
  //   const targetAcc = await Account.findOne({ name: target });
  
  //   if (!sourceAcc || !targetAcc) throw new Error('Invalid account name');
  
  //   sourceAcc.balance += numericAmount; // Equity grows
  //   targetAcc.balance += numericAmount; // Cash grows
  
  //   await Promise.all([sourceAcc.save(), targetAcc.save()]);
  
  //   return await JournalEntry.create({
  //     description,
  //     debit: { account: targetAcc._id, amount:numericAmount },
  //     credit: { account: sourceAcc._id, amount:numericAmount }
  //   });
  // };

//new
exports.addMoneyAsset = async ({ amount, source, target, description, userId }) => {

  const numericAmount = Number(amount);

  const sourceAcc = await Account.findOne({ name: source });
  const targetAcc = await Account.findOne({ name: target });

  if (!sourceAcc || !targetAcc) throw new Error('Invalid account name');

  // ✅ Generate voucher
  const voucherNo = await generateMoneyVoucherNo();

  // ✅ Save business record
  const record = await MoneyAsset.create({
    voucherNo,
    source,
    target,
    amount: numericAmount,
    description,
    createdBy: userId
  });

  // ✅ Accounting logic
  sourceAcc.balance += numericAmount; // Equity ↑
  targetAcc.balance += numericAmount; // Cash/Bank ↑

  await Promise.all([
    sourceAcc.save(),
    targetAcc.save()
  ]);

  // ✅ Journal entry
  await JournalEntry.create({
    description: description || 'Capital Injection',
    debit: { account: targetAcc._id, amount: numericAmount },
    credit: { account: sourceAcc._id, amount: numericAmount }
  });

  return record;
};

// ✅ GET MONEY ASSETS
exports.getMoneyAssetsService = async () => {
  return await MoneyAsset.find().sort({ createdAt: -1 });
};



//old
  // exports.addExpense = async ({ amount, category, paidFrom, description }) => {

  //   const numericAmount = Number(amount); // ✅ convert to number

  //   const expenseAcc = await Account.findOne({ name: category });
  //   const paidFromAcc = await Account.findOne({ name: paidFrom });
  
  //   if (!expenseAcc || !paidFromAcc) throw new Error('Invalid account name');
  
  //   expenseAcc.balance += numericAmount; // Expense increases
  //   paidFromAcc.balance -= numericAmount; // Asset (Cash/Bank) decreases
  
  //   await Promise.all([expenseAcc.save(), paidFromAcc.save()]);
  
  //   return await JournalEntry.create({
  //     description: description || `Expense - ${category}`,
  //     debit: { account: expenseAcc._id, amount:numericAmount },
  //     credit: { account: paidFromAcc._id, amount:numericAmount }
  //   });
  // };

  //new
  exports.addExpense = async ({ amount, category, paidFrom, description, userId }) => {

    const numericAmount = Number(amount);
  
    const expenseAcc = await Account.findOne({ name: category });
    const paidFromAcc = await Account.findOne({ name: paidFrom });
  
    if (!expenseAcc || !paidFromAcc) throw new Error('Invalid account name');
  
    // ✅ Generate voucher
    const voucherNo = await generateExpenseVoucherNo();
  
    // ✅ Save expense record
    const expense = await Expense.create({
      voucherNo,
      category,
      amount: numericAmount,
      paidFrom,
      description,
      createdBy: userId
    });
  
    // ✅ Update accounts
    expenseAcc.balance += numericAmount;
    paidFromAcc.balance -= numericAmount;
  
    await Promise.all([expenseAcc.save(), paidFromAcc.save()]);
  
    // ✅ Journal Entry
    await JournalEntry.create({
      description: description || `Expense - ${category}`,
      debit: { account: expenseAcc._id, amount: numericAmount },
      credit: { account: paidFromAcc._id, amount: numericAmount }
    });
  
    return expense;
  };

  // ✅ GET EXPENSES
exports.getExpensesService = async () => {
  return await Expense.find().sort({ createdAt: -1 });
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


//reports
exports.getAnalytics = async (year) => {
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  // Initialize months
  const months = Array.from({ length: 12 }, () => ({
    sales: 0,
    salaryExp: 0,
    additionalExp: 0,
    totalExpenses: 0,
    profit: 0
  }));

  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year}-12-31T23:59:59.999Z`);

  // --- 1️⃣ Sales per month ---
  const salesData = await SalesTransaction.aggregate([
    {
      $match: {
        status: { $in: ['Completed','Pending','Free'] },
        reversedBy: null,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        totalSales: { $sum: { $ifNull: ['$totalAmount', 0] } },
        totalProfit: { $sum: { $ifNull: ['$totalProfit', 0] } }
      }
    }
  ]);

  salesData.forEach(s => {
    const idx = s._id.month - 1;
    months[idx].sales = s.totalSales || 0;
    months[idx].profit = s.totalProfit || 0;
  });

  // --- 2️⃣ Expenses per month ---
  const expenseEntries = await Expense.find({
    category: { $in: ['Salary Expense','Additional Expense'] },
    date: { $gte: start, $lte: end }
  }).lean(); // Convert to plain objects

  expenseEntries.forEach(exp => {
    if (!exp.amount) return; // skip invalid
    const idx = new Date(exp.date).getMonth();
    const amount = Number(exp.amount) || 0;

    if (exp.category === 'Salary Expense') months[idx].salaryExp += amount;
    if (exp.category === 'Additional Expense') months[idx].additionalExp += amount;
  });

  // --- 3️⃣ Total expenses and adjust profit ---
  months.forEach(m => {
    const salesMinusProfit = (m.sales || 0) - (m.profit || 0);
    const salary = m.salaryExp || 0;
    const additional = m.additionalExp || 0;

    m.totalExpenses = salesMinusProfit + salary + additional;
    m.profit = (m.sales || 0) - m.totalExpenses;
  });

  // --- 4️⃣ Format and return ---
  return months.map((m, i) => ({
    month: monthNames[i],
    sales: Number(m.sales.toFixed(2)),
    salaryExp: Number((m.salaryExp || 0).toFixed(2)),
    additionalExp: Number((m.additionalExp || 0).toFixed(2)),
    totalExpenses: Number((m.totalExpenses || 0).toFixed(2)),
    profit: Number((m.profit || 0).toFixed(2))
  }));
};

  async function generateExpenseVoucherNo() {
    const currentYearMonth = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
  
    const lastExpense = await Expense.findOne({
      voucherNo: new RegExp(`EXP-${currentYearMonth}`)
    }).sort({ createdAt: -1 });
  
    if (!lastExpense) {
      return `EXP-${currentYearMonth}-0001`;
    }
  
    const lastNumber = parseInt(lastExpense.voucherNo.split('-')[2]);
    const newNumber = lastNumber + 1;
  
    return `EXP-${currentYearMonth}-${String(newNumber).padStart(4, '0')}`;
  }


  async function generateMoneyVoucherNo() {
    const currentYearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  
    const last = await MoneyAsset.findOne({
      voucherNo: new RegExp(`CAP-${currentYearMonth}`)
    }).sort({ createdAt: -1 });
  
    if (!last) {
      return `CAP-${currentYearMonth}-0001`;
    }
  
    const lastNumber = parseInt(last.voucherNo.split('-')[2]);
    const newNumber = lastNumber + 1;
  
    return `CAP-${currentYearMonth}-${String(newNumber).padStart(4, '0')}`;
  }