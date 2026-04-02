const { createSalesTransaction,getAllSalesTransactions,reverseTransaction,markTransactionCompleted,getTransactionWithItems } = require('../services/salesTransaction.service');

exports.createTransactionController = async (req, res) => {
  try {
    const userId = req.user._id; // assuming authentication middleware
    const result = await createSalesTransaction({
      userId,
      customerName: req.body.customerName || '',
      paymentMethod: req.body.paymentMethod || 'Cash',
      status: req.body.status || 'Completed',
      items: req.body.items,
      discount:req.body.discount
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Transaction failed',
      error: error.message
    });
    console.log(error);
  }
};

exports.getAllTransactionsController = async (req, res) => {
  try {
    const transactions = await getAllSalesTransactions();
    res.json({ data: transactions });
  } catch (error) {
    console.error('Error getting sales transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.reverseTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const result = await reverseTransaction(id, userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markTransactionCompleted = async (req, res) => {
  try {
    const updatedTransaction = await markTransactionCompleted(req.params.id);
    res.status(200).json({
      message: 'Transaction marked as completed successfully',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Error marking transaction as completed:', error);
    res.status(error.status || 500).json({ message: error.message || 'Internal server error' });
  }
};

exports.getSalesTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getTransactionWithItems(id);

    if (!result.transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching sales transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

