const mongoose = require('mongoose');
const SalesTransaction = require('../models/salesTransaction.model');
const TransactionItem = require('../models/transactionItem.model');
const Inventory = require('../models/inventory.model');
const SalesReturn = require('../models/salesReturn.model');
const Account = require('../models/account.model');
const JournalEntry = require('../models/journal.model');

exports.processReturn = async ({ transactionId, items, userId }) => {
  const session = await mongoose.startSession();

  try {
    let returnDoc = null;

    await session.withTransaction(async () => {
      const transaction = await SalesTransaction.findById(transactionId).session(session);
      if (!transaction) throw new Error('Original transaction not found');

      if (transaction.status === 'Cancelled') {
        throw new Error('This transaction has already been canceled!');
      }

      const originalItems = await TransactionItem.find({ transaction: transactionId }).session(session);
      const isFree = transaction.status === 'Free';

      let totalReturnAmount = 0;
      let totalReturnCost = 0;
      const journalEntries = [];

      for (const returnItem of items) {
        // ✅ Match ONLY by product
        const match = originalItems.find(
          i => i.product.toString() === returnItem.product
        );

        if (!match) throw new Error(`Product not found in original transaction`);

        const productId = new mongoose.Types.ObjectId(match.product);

        // ✅ Check previous returns (NO SIZE)
        const totalPreviousReturns = await SalesReturn.aggregate([
          { $match: { transaction: new mongoose.Types.ObjectId(transaction._id) } },
          { $unwind: '$items' },
          {
            $match: {
              'items.product': productId
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$items.quantity' }
            }
          }
        ]).session(session);

        const alreadyReturnedQty = totalPreviousReturns[0]?.total || 0;
        const remainingQty = match.quantity - alreadyReturnedQty;

        if (returnItem.quantity > remainingQty) {
          throw new Error(`Return quantity exceeds sold quantity`);
        }

        // ✅ Update Inventory (NO SIZE)
        let inventory = await Inventory.findOne({ product: returnItem.product }).session(session);

        if (!inventory) {
          inventory = await Inventory.create([{
            product: returnItem.product,
            quantity: returnItem.quantity
          }], { session });
        } else {
          inventory.quantity += returnItem.quantity;
          inventory.lastUpdated = new Date();
          await inventory.save({ session });
        }

        // ✅ Calculations
        const returnAmount = match.sellingPrice * returnItem.quantity;
        const returnCost = match.costPrice * returnItem.quantity;

        totalReturnAmount += returnAmount;
        totalReturnCost += returnCost;
      }

      // ✅ Save return document
      returnDoc = await SalesReturn.create([{
        transaction: transactionId,
        items: items.map(i => ({
          product: i.product,
          quantity: i.quantity
        })),
        returnedBy: userId
      }], { session });

      // ================= ACCOUNTING =================

      if (!isFree && totalReturnAmount > 0) {
        const [cash, sales, inventoryAcc, cogs] = await Promise.all([
          Account.findOne({ name: 'Cash' }).session(session),
          Account.findOne({ name: 'Sales Revenue' }).session(session),
          Account.findOne({ name: 'Inventory' }).session(session),
          Account.findOne({ name: 'COGS' }).session(session),
        ]);

        if (!cash || !sales || !inventoryAcc || !cogs) {
          throw new Error('Required accounts not found');
        }

        cash.balance -= totalReturnAmount;
        sales.balance -= totalReturnAmount;
        inventoryAcc.balance += totalReturnCost;
        cogs.balance -= totalReturnCost;

        await Promise.all([
          cash.save({ session }),
          sales.save({ session }),
          inventoryAcc.save({ session }),
          cogs.save({ session })
        ]);

        journalEntries.push(
          {
            description: `Sales Return - Refund for ${transaction.customerName}`,
            debit: { account: sales._id, amount: totalReturnAmount },
            credit: { account: cash._id, amount: totalReturnAmount }
          },
          {
            description: `Sales Return - Restore inventory`,
            debit: { account: inventoryAcc._id, amount: totalReturnCost },
            credit: { account: cogs._id, amount: totalReturnCost }
          }
        );

        await JournalEntry.insertMany(journalEntries, { session });
      }

      // ✅ FREE SALE RETURN
      if (isFree) {
        const inventoryAcc = await Account.findOne({ name: 'Inventory' }).session(session);
        const cogsAcc = await Account.findOne({ name: 'COGS' }).session(session);

        if (!inventoryAcc || !cogsAcc) throw new Error('Accounts not found');

        inventoryAcc.balance += totalReturnCost;
        cogsAcc.balance -= totalReturnCost;

        await Promise.all([
          inventoryAcc.save({ session }),
          cogsAcc.save({ session })
        ]);

        await JournalEntry.create([{
          description: `Return of Free Item - Transaction ${transactionId}`,
          debit: { account: inventoryAcc._id, amount: totalReturnCost },
          credit: { account: cogsAcc._id, amount: totalReturnCost }
        }], { session });
      }
    });

    return returnDoc?.[0];

  } catch (err) {
    console.error('Sales return failed:', err);
    throw err;
  } finally {
    session.endSession();
  }
};

exports.getReturnsByTransaction = async (transactionId) => {
  const returns = await SalesReturn.find({ transaction: transactionId })
    .populate('returnedBy', 'name')
    .populate({
      path: 'items.product',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'brand', select: 'name' }
      ],
      select: 'name category brand'
    })
    .lean();

  return returns;
};

exports.getAllSalesReturns = async () => {
  const returns = await SalesReturn.find()
    .populate('returnedBy', 'name')
    .populate({
      path: 'items.product',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'brand', select: 'name' }
      ],
      select: 'name category brand'
    })
    .populate('transaction', 'customerName createdAt totalAmount')
    .sort({ createdAt: -1 }) // Optional: newest first
    .lean();

  return returns;
};
