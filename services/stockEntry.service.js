const StockEntry = require('../models/stockEntry.model');
const StockEntryItem = require('../models/stockEntryItem.model');
const Inventory = require('../models/inventory.model');
const Product = require('../models/product.model');
const accountService = require('./account.service.js'); 
const mongoose = require('mongoose');
const Account = require('../models/account.model.js');
const JournalEntry = require('../models/journal.model.js');

exports.createStockEntry = async (data, user) => {
  const { supplier, invoiceNumber, items, location } = data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stockEntry = await StockEntry.create([{
      supplier,
      invoiceNumber,
      createdBy: user._id,
      location
    }], { session });

    let totalAmount = 0;

    for (const item of items) {
      const product = item.product;
      const quantity = Number(item.quantity);
      const costPrice = Number(item.costPrice);

      if (!product || isNaN(quantity) || isNaN(costPrice)) {
        throw new Error('Invalid product, quantity, or cost price');
      }

      totalAmount += quantity * costPrice;

      // ✅ Save stock entry item
      await StockEntryItem.create([{
        stockEntry: stockEntry[0]._id,
        product,
        quantity,
        costPrice
      }], { session });

      // ✅ Update inventory
      let inventory = await Inventory.findOne({ product }).session(session);

      if (!inventory) {
        await Inventory.create([{
          product,
          quantity
        }], { session });
      } else {
        inventory.quantity += quantity;
        inventory.lastUpdated = new Date();
        await inventory.save({ session });
      }

      // Optional: Update average cost price
      const prod = await Product.findById(product).session(session);
      prod.averageCostPrice = costPrice;
      await prod.save({ session });
    }

    stockEntry[0].totalAmount = totalAmount;
    await stockEntry[0].save({ session });

    // await accountService.buyStock(totalAmount, session);//before credit
    await accountService.buyStock(totalAmount, session, supplier);//after credit

    await session.commitTransaction();
    session.endSession();

    return stockEntry[0]._id;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    throw error;
  }
};
  
  exports.getAllStockEntriesDetailed = async ()=> {
    // Find all stock entries
    const entries = await StockEntry.find()
      .populate('supplier', 'name') // Populate supplier name only
      .populate('createdBy', 'username') // Populate creator username
      .lean();
  
    // For each entry, find related StockEntryItems and populate product info
    const entriesWithItems = await Promise.all(
      entries.map(async (entry) => {
        const items = await StockEntryItem.find({ stockEntry: entry._id })
          .populate('product', 'name')
          .lean();
  
        return {
          ...entry,
          items,
        };
      })
    );
  
    return entriesWithItems;
  }


exports.getAllStockEntries = async () => {
    return await StockEntry.find()
      .populate('supplier', 'name') // only get supplier name
      .sort({ createdAt: -1 });     // latest first
  };


  exports.getAllStockEntryItems = async () => {
    return await StockEntryItem.find().populate('product', 'name code');
  };

  exports.getFIFOStockItem = async (productId, quantity) => {
    const quantityToSell = quantity;
  
    // ✅ Step 1: Check inventory
    const inventory = await Inventory.findOne({ product: productId });
    if (!inventory) throw new Error('Inventory not found');
  
    if (inventory.quantity < quantityToSell) {
      throw new Error('Not enough stock available');
    }
  
    const remainingQtyInInventory = inventory.quantity;
  
    // ✅ Step 2: Get all stock entries (FIFO order)
    const stockEntries = await StockEntryItem.find({
      product: productId
    }).sort({ createdAt: 1 });
  
    // ✅ Step 3: Calculate already sold quantity
    const totalPurchased = stockEntries.reduce((acc, entry) => acc + entry.quantity, 0);
    const soldQuantity = totalPurchased - remainingQtyInInventory;
  
    let cumulativeQty = 0;
    let remainingSaleQty = quantityToSell;
    let totalCost = 0;
  
    // ✅ Step 4: FIFO calculation
    for (const entry of stockEntries) {
      cumulativeQty += entry.quantity;
  
      if (soldQuantity >= cumulativeQty) {
        continue; // already consumed batch
      }
  
      const availableQtyFromBatch = cumulativeQty - soldQuantity;
      const usedQty = Math.min(availableQtyFromBatch, remainingSaleQty);
  
      totalCost += usedQty * entry.costPrice;
      remainingSaleQty -= usedQty;
  
      if (remainingSaleQty === 0) break;
    }
  
    if (remainingSaleQty > 0) {
      throw new Error('Not enough stock for FIFO calculation');
    }
  
    return totalCost / quantityToSell;
  };


  // services/stockEntryService.js

exports.deleteStockEntry = async (stockEntryId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get stock entry
    const stockEntry = await StockEntry.findById(stockEntryId).session(session);
    if (!stockEntry) {
      throw new Error('Stock entry not found');
    }

    // 2. Get related items
    const items = await StockEntryItem.find({ stockEntry: stockEntryId }).session(session);

    let totalAmount = 0;

    // 3. Reverse inventory
    for (const item of items) {
      const { product, quantity, costPrice } = item;

      totalAmount += quantity * costPrice;

      const inventory = await Inventory.findOne({ product }).session(session);

      if (!inventory || inventory.quantity < quantity) {
        throw new Error('Invalid inventory state. Cannot delete.');
      }

      inventory.quantity -= quantity;
      await inventory.save({ session });
    }

    // 4. Reverse accounts
    const inventoryAccount = await Account.findOne({ name: 'Inventory' }).session(session);
    const payableAccount = await Account.findOne({ name: 'Accounts Payable' }).session(session);

    if (!inventoryAccount || !payableAccount) {
      throw new Error('Accounts not found');
    }

    inventoryAccount.balance -= totalAmount;
    payableAccount.balance -= totalAmount;

    await Promise.all([
      inventoryAccount.save({ session }),
      payableAccount.save({ session })
    ]);

    // 5. Create reverse journal entry
    await JournalEntry.create([{
      description: `Reversal of Stock Entry ${stockEntry.invoiceNumber || ''}`,
      debit: { account: payableAccount._id, amount: totalAmount },
      credit: { account: inventoryAccount._id, amount: totalAmount }
    }], { session });

    // 6. Delete items
    await StockEntryItem.deleteMany({ stockEntry: stockEntryId }).session(session);

    // 7. Delete stock entry
    await StockEntry.findByIdAndDelete(stockEntryId).session(session);

    await session.commitTransaction();
    session.endSession();

    return stockEntryId;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};