// services/purchaseReturn.service.js

const mongoose = require('mongoose');

const PurchaseReturn = require('../models/purchaseReturn.model');
const PurchaseReturnItem = require('../models/purchaseReturnItem.model');
const StockEntryItem = require('../models/stockEntryItem.model');
const StockEntry = require('../models/stockEntry.model');
const Inventory = require('../models/inventory.model');
const Account = require('../models/account.model');
const JournalEntry = require('../models/journal.model');

exports.createPurchaseReturn = async (data, user) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const {
      stockEntry,
      items,
      reason
    } = data;

    const stock = await StockEntry.findById(stockEntry)
      .session(session);

    if (!stock) {
      throw new Error('Stock entry not found');
    }

    const purchaseReturn = await PurchaseReturn.create(
      [
        {
          stockEntry,
          supplier: stock.supplier,
          reason,
          createdBy: user._id
        }
      ],
      { session }
    );

    let totalAmount = 0;

    for (const item of items) {

      const stockItem = await StockEntryItem.findById(
        item.stockEntryItemId
      ).session(session);

      if (!stockItem) {
        throw new Error('Stock item not found');
      }

      const returnQty = Number(item.quantity);

      if (returnQty <= 0) {
        throw new Error('Invalid return quantity');
      }

      // already returned qty
      const previousReturns = await PurchaseReturnItem.aggregate([
        {
          $match: {
            stockEntry: new mongoose.Types.ObjectId(stockEntry),
            stockEntryItem: new mongoose.Types.ObjectId(item.stockEntryItemId)
          }
        },
        {
          $group: {
            _id: '$stockEntryItem',
            totalReturned: { $sum: '$quantity' }
          }
        }
      ]);

      const alreadyReturned =
        previousReturns[0]?.totalReturned || 0;

      const availableQty =
        stockItem.quantity - alreadyReturned;

      if (returnQty > availableQty) {
        throw new Error(
          `Return quantity exceeded for product`
        );
      }

      // inventory reduce
      const inventory = await Inventory.findOne({
        product: stockItem.product
      }).session(session);

      if (!inventory || inventory.quantity < returnQty) {
        throw new Error(
          'Not enough inventory to return'
        );
      }

      inventory.quantity -= returnQty;

      await inventory.save({ session });

      const amount =
        returnQty * stockItem.costPrice;

      totalAmount += amount;

      await PurchaseReturnItem.create(
        [
          {
            purchaseReturn:
              purchaseReturn[0]._id,

            stockEntry,

            stockEntryItem: stockItem._id,   // ✅ ADD THIS

            product: stockItem.product,

            quantity: returnQty,

            costPrice: stockItem.costPrice,

            amount
          }
        ],
        { session }
      );
    }

    purchaseReturn[0].totalAmount =
      totalAmount;

    await purchaseReturn[0].save({
      session
    });

    // accounting reverse
    const inventoryAccount =
      await Account.findOne({
        name: 'Inventory'
      }).session(session);

    const payableAccount =
      await Account.findOne({
        name: 'Accounts Payable'
      }).session(session);

    inventoryAccount.balance -= totalAmount;
    payableAccount.balance -= totalAmount;

    await inventoryAccount.save({ session });
    await payableAccount.save({ session });

    // journal entry
    await JournalEntry.create(
      [
        {
          description:
            'Purchase Return',

          debit: {
            account:
              payableAccount._id,
            amount: totalAmount
          },

          credit: {
            account:
              inventoryAccount._id,
            amount: totalAmount
          }
        }
      ],
      { session }
    );

    await session.commitTransaction();

    session.endSession();

    return purchaseReturn[0];

  } catch (error) {

    await session.abortTransaction();

    session.endSession();

    throw error;
  }
};

exports.getAllPurchaseReturns =
  async () => {

    return await PurchaseReturn.find()
      .populate('supplier')
      .populate('stockEntry')
      .sort({ createdAt: -1 });

  };

  exports.getPurchaseReturnByStockEntry = async (stockEntryId) => {

    const data = await PurchaseReturnItem.aggregate([
      {
        $match: {
          stockEntry: new mongoose.Types.ObjectId(stockEntryId)
        }
      },
      {
        $group: {
          _id: "$stockEntryItem",
          totalReturned: { $sum: "$quantity" },
          product: { $first: "$product" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      }
    ]);
  
    return data;
  };