const salesReturnService = require('../services/salesReturn.service');

exports.handleReturn = async (req, res) => {
  try {
    const { transactionId, items } = req.body;
    const userId = req.user._id; // assuming user is authenticated

    const result = await salesReturnService.processReturn({ transactionId, items, userId });

    res.status(201).json({
      message: 'Return processed successfully',
      return: result
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getReturnsByTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const returns = await salesReturnService.getReturnsByTransaction(transactionId);

    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    console.error('Error fetching sales returns:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch sales returns' });
  }
};

exports.getAllSalesReturns = async (req, res) => {
  try {
    const returns = await salesReturnService.getAllSalesReturns();
    res.json(returns);
  } catch (error) {
    console.error('Error fetching all sales returns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
