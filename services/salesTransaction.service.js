// services/salesTransaction.service.js
const mongoose = require('mongoose');
const SalesTransaction = require('../models/salesTransaction.model');
const TransactionItem = require('../models/transactionItem.model');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const accountService = require('./account.service.js'); 
const JournalEntry = require('../models/journal.model');
const Account = require('../models/account.model');

async function createSalesTransaction({ userId, customerName, paymentMethod, status, items }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalAmount = 0;
    let totalCost = 0;
    let totalProfit = 0;

    const transactionItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Product not found`);

      const inventory = await Inventory.findOne({ product: product._id }).session(session);
      if (!inventory) throw new Error(`Inventory not found`);

      if (inventory.quantity < item.quantity) throw new Error(`Not enough stock`);

      inventory.quantity -= item.quantity;
      await inventory.save({ session });

      const itemQuantity = Number(item.quantity) || 0;
      const itemSelling = Number(item.sellingPrice) || 0;
      const itemCost = Number(item.costPrice) || 0;
      const itemDiscount = Number(item.discount) || 0;

      const itemTotal = itemSelling * itemQuantity;
      const itemTotalAfterDiscount = itemTotal - itemDiscount;
      const profit = itemTotalAfterDiscount - itemCost * itemQuantity;

      totalAmount += itemTotalAfterDiscount;
      totalCost += itemCost * itemQuantity;
      totalProfit += profit;

      transactionItems.push({
        product: product._id,
        quantity: itemQuantity,
        sellingPrice: itemSelling,
        costPrice: itemCost,
        discount: itemDiscount,
        profit
      });
    }

    const invoiceNo = await generateInvoiceNo();

    const salesTransaction = new SalesTransaction({
      user: userId,
      invoiceNo,
      customerName,
      totalAmount,
      totalProfit,
      discount: 0, // overall discount can be handled separately
      paymentMethod,
      status,
    });

    await salesTransaction.save({ session });

    for (const item of transactionItems) {
      await TransactionItem.create([{
        transaction: salesTransaction._id,
        product: item.product,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        discount: item.discount,
        profit: item.profit
      }], { session });
    }

    // Accounting
    await accountService.recordSale({
      salePrice: status === 'Free' ? 0 : totalAmount,
      costPrice: totalCost,
      customerName,
      status,
      updateInventory: true
    });

    await session.commitTransaction();
    session.endSession();

    return salesTransaction;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

async function getAllSalesTransactions() {
  // Fetch all sales transactions with user populated
  const transactions = await SalesTransaction.find()
    .populate('user', 'name')   // only fetch user name
    .sort({ createdAt: -1 });

  // For each transaction, fetch related transaction items with product name populated
  const detailedTransactions = await Promise.all(
    transactions.map(async (tx) => {
      const items = await TransactionItem.find({ transaction: tx._id })
        .populate({
          path: 'product',
          select: 'name code category brand',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'brand', select: 'name' }
          ]
        });

      return {
        ...tx.toObject(),
        items,
      };
    })
  );

  return detailedTransactions;
}


async function reverseTransaction(transactionId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await SalesTransaction.findById(transactionId).session(session);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status === 'Cancelled') throw new Error('Already cancelled');

    const isCompleted = transaction.status === 'Completed';
    const isFree = transaction.status === 'Free';
    const isPending = transaction.status === 'Pending';

    const totalSale = (isCompleted && !isFree)
      ? transaction.totalAmount
      : 0;

    transaction.status = 'Cancelled';
    transaction.reversedBy = userId;
    transaction.reversedAt = new Date();
    await transaction.save({ session });

    const items = await TransactionItem.find({ transaction: transactionId }).session(session);

    let totalCost = 0;

    // ================= INVENTORY =================
    for (const item of items) {
      const inventory = await Inventory.findOne({ product: item.product }).session(session);

      if (!inventory) {
        await Inventory.create([{
          product: item.product,
          quantity: item.quantity
        }], { session });
      } else {
        inventory.quantity += item.quantity;
        inventory.lastUpdated = new Date();
        await inventory.save({ session });
      }

      totalCost += (Number(item.costPrice) || 0) * (Number(item.quantity) || 0);
    }

    // ================= ACCOUNTING =================

    const [cash, sales, inventoryAcc, cogs] = await Promise.all([
      Account.findOne({ name: 'Cash' }).session(session),
      Account.findOne({ name: 'Sales Revenue' }).session(session),
      Account.findOne({ name: 'Inventory' }).session(session),
      Account.findOne({ name: 'COGS' }).session(session),
    ]);

    if (!inventoryAcc || !cogs) {
      throw new Error('Accounts not found');
    }

    const journalEntries = [];

    // ✅ 1. Reverse revenue ONLY for completed (non-free)
    if (isCompleted && !isFree && totalSale > 0) {
      if (!cash || !sales) {
        throw new Error('Accounts not found');
      }

      cash.balance -= totalSale;
      sales.balance -= totalSale;

      journalEntries.push({
        description: `Reversal - Sale Refund ${transactionId}`,
        debit: { account: sales._id, amount: totalSale },
        credit: { account: cash._id, amount: totalSale }
      });
    }

    // ✅ 2. ALWAYS reverse inventory & COGS (VERY IMPORTANT FIX)
    if (isPending || isCompleted || isFree) {
      inventoryAcc.balance += totalCost;
      cogs.balance -= totalCost;

      journalEntries.push({
        description: `Reversal - Inventory Restore ${transactionId}`,
        debit: { account: inventoryAcc._id, amount: totalCost },
        credit: { account: cogs._id, amount: totalCost }
      });
    }

    // ================= SAVE =================
    const updates = [
      inventoryAcc.save({ session }),
      cogs.save({ session })
    ];

    if (isCompleted && !isFree && totalSale > 0) {
      updates.push(
        cash.save({ session }),
        sales.save({ session })
      );
    }

    await Promise.all(updates);

    if (journalEntries.length > 0) {
      await JournalEntry.insertMany(journalEntries, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return { message: 'Transaction reversed successfully' };

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
async function markTransactionCompleted(transactionId) {
  const transaction = await SalesTransaction.findById(transactionId);

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    throw error;
  }

  if (transaction.status !== 'Pending') {
    const error = new Error('Only pending transactions can be marked as completed');
    error.status = 400;
    throw error;
  }

  // ✅ Update status
  transaction.status = 'Completed';
  await transaction.save();

  // ✅ Fetch items
  const items = await TransactionItem.find({ transaction: transactionId });

  let totalAmount = 0;
  let totalCost = 0;
  let totalProfit = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const selling = Number(item.sellingPrice) || 0;
    const cost = Number(item.costPrice) || 0;
    const discount = Number(item.discount) || 0;

    const itemTotal = selling * qty;
    const itemTotalAfterDiscount = itemTotal - discount;
    const itemCost = cost * qty;
    const profit = itemTotalAfterDiscount - itemCost;

    totalAmount += itemTotalAfterDiscount;
    totalCost += itemCost;
    totalProfit += profit;
  }

  // ✅ Optional: update totals in transaction (recommended)
  transaction.totalAmount = totalAmount;
  transaction.totalProfit = totalProfit;
  await transaction.save();

  // ✅ Accounting
  await accountService.recordSale({
    salePrice: totalAmount, // already discounted
    costPrice: totalCost,
    customerName: transaction.customerName,
    status: 'Completed',
    updateInventory: false
  });

  return transaction;
}

async function getTransactionWithItems(transactionId){
  const transaction = await SalesTransaction.findById(transactionId)
    .populate('user', 'username') // Populate user who did the sale
    .lean();

  const items = await TransactionItem.find({ transaction: transactionId })
    .populate({
      path: 'product',
      select: 'name brand category',
      populate: [
        { path: 'brand', select: 'name' },
        { path: 'category', select: 'name' }
      ]
    })
    .lean();

  return { transaction, items };
};


module.exports = {
  createSalesTransaction,
  getAllSalesTransactions,
  reverseTransaction,
  markTransactionCompleted,
  getTransactionWithItems 
};


async function generateInvoiceNo() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Find last invoice of this month
  const lastInvoice = await SalesTransaction.findOne({
    invoiceNo: { $regex: `^INV-${yearMonth}` }
  }).sort({ createdAt: -1 });

  if (!lastInvoice) {
    return `INV-${yearMonth}-0001`;
  }

  const lastNumber = parseInt(lastInvoice.invoiceNo.split('-')[2]);
  const newNumber = lastNumber + 1;

  return `INV-${yearMonth}-${String(newNumber).padStart(4, '0')}`;
}