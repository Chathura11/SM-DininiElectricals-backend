const accountService = require('../services/account.service.js');

exports.purchaseStock = async (req, res) => {
  const { amount } = req.body;
  try {
    const entry = await accountService.buyStock(amount);
    res.status(200).json({ message: 'Stock purchased', entry });
  } catch (err) {
    res.status(500).json({ message: 'Error purchasing stock', error: err.message });
  }
};

exports.sellProduct = async (req, res) => {
  const { salePrice, costPrice,customerName } = req.body;
  try {
    const entries = await accountService.recordSale({ salePrice, costPrice,customerName });
    res.status(200).json({ message: 'Sale recorded', entries });
  } catch (err) {
    res.status(500).json({ message: 'Error recording sale', error: err.message });
  }
};

exports.addAssetMoney = async (req, res) => {
  try {
    const journal = await accountService.addMoneyAsset(req.body);
    res.status(200).json({ message: 'Money asset added successfully', journal });
  } catch (err) {
    res.status(500).json({ message: 'Error adding money asset', error: err.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const journal = await accountService.addExpense(req.body);
    res.status(200).json({ message: 'Expense recorded successfully', journal });
  } catch (err) {
    res.status(500).json({ message: 'Error recording expense', error: err.message });
  }
};

exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await accountService.getAllAccounts();
    res.status(200).json({ accounts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching accounts', error: err.message });
  }
};

exports.getAllJournalEntries = async (req, res) => {
  try {
    const entries = await accountService.getAllJournalEntries();
    res.status(200).json(entries);
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching journal entries',
      error: err.message
    });
  }
};