const { createStockEntry,getAllStockEntries,getAllStockEntryItems,getFIFOStockItem,getAllStockEntriesDetailed} = require('../services/stockEntry.service');

exports.CreateStockEntry = async (req, res) => {
    try {
        const result = await createStockEntry(req.body, req.user);
        res.status(200).json({ success: 1, data: result });
    } catch (error) {
        res.status(500).json({ success: 0, data: error.message });
    }
};

exports.GetAllStockEntries = async (req, res) => {
    try {
      const entries = await getAllStockEntries();
      res.status(200).json({
        success: true,
        data: entries,
      });
    } catch (err) {
      console.error('Failed to fetch stock entries:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching stock entries',
      });
    }
  };

  exports.GetAllStockEntryItems = async (req, res) => {
    try {
      const items = await getAllStockEntryItems();
      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching stock entry items:', error);
      res.status(500).json({ message: 'Failed to fetch stock entry items.' });
    }
  };


  exports.getFIFOCost = async (req, res) => {
    const { productId, quantity } = req.query;
    try {
      const costPrice = await getFIFOStockItem(productId, parseInt(quantity));
      res.status(200).json({ costPrice });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  exports.getAllStockEntriesDetailed = async (req, res) =>{
    try {
      const data = await getAllStockEntriesDetailed();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

