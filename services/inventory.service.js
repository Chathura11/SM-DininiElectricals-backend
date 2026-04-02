const Inventory = require('../models/inventory.model');

exports.fetchInventories = async () => {
  return await Inventory.find()
    .populate({
      path: 'product',
      select: 'name code category brand',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'brand', select: 'name' }
      ]
    })
    .exec();
};
