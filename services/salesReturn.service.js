const mongoose = require('mongoose');
const SalesTransaction = require('../models/salesTransaction.model');
const TransactionItem = require('../models/transactionItem.model');
const Inventory = require('../models/inventory.model');
const SalesReturn = require('../models/salesReturn.model');
const Account = require('../models/account.model');
const JournalEntry = require('../models/journal.model');
const CustomerLoan = require('../models/customerLoan.model');
const LoanPayment = require('../models/loanPayment.model');

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
      const isPending = transaction.status === 'Pending';
      const isCompleted = transaction.status === 'Completed';

      let totalReturnAmount = 0;
      let totalReturnCost = 0;

      // ================= PROCESS ITEMS =================
      for (const returnItem of items) {

        const match = originalItems.find(
          i => i.product.toString() === returnItem.product
        );

        if (!match) throw new Error(`Product not found in original transaction`);

        const productId = new mongoose.Types.ObjectId(match.product);

        // ✅ Validate previous returns
        const totalPreviousReturns = await SalesReturn.aggregate([
          { $match: { transaction: new mongoose.Types.ObjectId(transaction._id) } },
          { $unwind: '$items' },
          { $match: { 'items.product': productId } },
          { $group: { _id: null, total: { $sum: '$items.quantity' } } }
        ]).session(session);

        const alreadyReturnedQty = totalPreviousReturns[0]?.total || 0;
        const remainingQty = match.quantity - alreadyReturnedQty;

        if (returnItem.quantity > remainingQty) {
          throw new Error(`Return quantity exceeds sold quantity`);
        }

        // ================= INVENTORY UPDATE =================
        let inventory = await Inventory.findOne({ product: returnItem.product }).session(session);

        if (!inventory) {
          await Inventory.create([{
            product: returnItem.product,
            quantity: returnItem.quantity
          }], { session });
        } else {
          inventory.quantity += returnItem.quantity;
          inventory.lastUpdated = new Date();
          await inventory.save({ session });
        }

        // ================= CALCULATIONS =================

        const discountPerUnit = (match.discount || 0) / match.quantity;

        const returnAmount =
          (match.sellingPrice - discountPerUnit) * returnItem.quantity;

        const returnCost =
          match.costPrice * returnItem.quantity;

        totalReturnAmount += returnAmount;
        totalReturnCost += returnCost;
      }

      // ================= SAVE RETURN =================
      returnDoc = await SalesReturn.create([{
        transaction: transactionId,
        items: items.map(i => ({
          product: i.product,
          quantity: i.quantity,
          reason: i.reason
        })),
        returnedBy: userId
      }], { session });

      // ================= STATUS UPDATE =================
      if (isPending) {
        transaction.status = 'Cancelled'; // better than Returned
      } else {
        transaction.status = 'Returned';
      }

      await transaction.save({ session });

      // ================= ACCOUNTING =================

      // 🔵 CASE 1: PENDING → ONLY INVENTORY + COGS

      //old
      // if (isPending) {
      //   const inventoryAcc = await Account.findOne({ name: 'Inventory' }).session(session);
      //   const cogsAcc = await Account.findOne({ name: 'COGS' }).session(session);

      //   if (!inventoryAcc || !cogsAcc) {
      //     throw new Error('Accounts not found');
      //   }

      //   inventoryAcc.balance += totalReturnCost;
      //   cogsAcc.balance -= totalReturnCost;

      //   await Promise.all([
      //     inventoryAcc.save({ session }),
      //     cogsAcc.save({ session })
      //   ]);

      //   await JournalEntry.create([{
      //     description: `Pending Sale Return - Restore inventory`,
      //     debit: { account: inventoryAcc._id, amount: totalReturnCost },
      //     credit: { account: cogsAcc._id, amount: totalReturnCost }
      //   }], { session });

      //   return;
      // }

      //new
      if (isPending) {

        const loan = await CustomerLoan.findOne({ transaction: transactionId }).session(session);
        if (!loan) throw new Error('Loan not found for this transaction');
      
        const payments = await LoanPayment.find({ loan: loan._id }).session(session);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      
        // ================= ACCOUNT =================
        const [inventoryAcc, cogsAcc, receivableAcc, cashAcc] = await Promise.all([
          Account.findOne({ name: 'Inventory' }).session(session),
          Account.findOne({ name: 'COGS' }).session(session),
          Account.findOne({ name: 'Accounts Receivable' }).session(session),
          Account.findOne({ name: 'Cash' }).session(session),
        ]);
      
        if (!inventoryAcc || !cogsAcc || !receivableAcc) {
          throw new Error('Accounts not found');
        }
      
        // ================= INVENTORY =================
        inventoryAcc.balance += totalReturnCost;
        cogsAcc.balance -= totalReturnCost;
      
        // ================= LOAN REDUCTION =================
        loan.totalAmount -= totalReturnAmount;
        loan.balanceAmount -= totalReturnAmount;
      
        if (loan.balanceAmount < 0) loan.balanceAmount = 0;
      
        // ================= ACCOUNT RECEIVABLE =================
        receivableAcc.balance -= totalReturnAmount;
      
        const journalEntries = [];

        const salesAcc = await Account.findOne({ name: 'Sales Revenue' }).session(session);

        if (!salesAcc) throw new Error('Sales Revenue account not found');
      
        // 🔵 Reduce receivable (sale reversal part)
        journalEntries.push({
          description: `Loan Adjustment - Sales Return`,
          debit: { account: salesAcc._id, amount: totalReturnAmount },
          credit: { account: receivableAcc._id, amount: totalReturnAmount }
        });
      
        // 🔵 Inventory restore
        journalEntries.push({
          description: `Inventory Restore - Sales Return`,
          debit: { account: inventoryAcc._id, amount: totalReturnCost },
          credit: { account: cogsAcc._id, amount: totalReturnCost }
        });
      
        // ================= IF CUSTOMER ALREADY PAID =================
        if (totalPaid > 0) {
      
          // If paid amount > new loan → refund extra
          if (totalPaid > loan.totalAmount) {
            const refund = totalPaid - loan.totalAmount;
      
            if (!cashAcc) throw new Error('Cash account not found');
      
            cashAcc.balance -= refund;
      
            journalEntries.push({
              description: `Refund due to sales return`,
              debit: { account: receivableAcc._id, amount: refund },
              credit: { account: cashAcc._id, amount: refund }
            });
      
            loan.paidAmount = loan.totalAmount;
            loan.balanceAmount = 0;
          } else {
            loan.balanceAmount = loan.totalAmount - totalPaid;
            loan.paidAmount = totalPaid;
          }
        }
      
        // ================= SAVE =================
        await Promise.all([
          inventoryAcc.save({ session }),
          cogsAcc.save({ session }),
          receivableAcc.save({ session }),
          loan.save({ session }),
          cashAcc?.save({ session })
        ]);
      
        await JournalEntry.insertMany(journalEntries, { session });
      
        // ================= STATUS =================
        if (loan.balanceAmount === 0) {
          transaction.status = 'Completed';
        } else {
          transaction.status = 'Pending';
        }
      
        await transaction.save({ session });
      
        return;
      }

      // 🟢 CASE 2: COMPLETED → FULL REVERSAL
      if (isCompleted && totalReturnAmount > 0) {

        const [cash, sales, inventoryAcc, cogs] = await Promise.all([
          Account.findOne({ name: 'Cash' }).session(session),
          Account.findOne({ name: 'Sales Revenue' }).session(session),
          Account.findOne({ name: 'Inventory' }).session(session),
          Account.findOne({ name: 'COGS' }).session(session),
        ]);

        if (!cash || !sales || !inventoryAcc || !cogs) {
          throw new Error('Required accounts not found');
        }

        // Reverse entries
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

        await JournalEntry.insertMany([
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
        ], { session });
      }

      // 🟡 CASE 3: FREE → ONLY INVENTORY + COGS
      if (isFree) {
        const inventoryAcc = await Account.findOne({ name: 'Inventory' }).session(session);
        const cogsAcc = await Account.findOne({ name: 'COGS' }).session(session);

        if (!inventoryAcc || !cogsAcc) {
          throw new Error('Accounts not found');
        }

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
