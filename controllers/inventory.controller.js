const inventoryService = require('../services/inventory.service');

exports.getInventories = async (req, res) => {
  try {
    const inventories = await inventoryService.fetchInventories();
    return res.status(200).json({ success: true, data: inventories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error fetching inventories' });
  }
};