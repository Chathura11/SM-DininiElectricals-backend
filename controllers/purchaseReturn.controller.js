// controllers/purchaseReturn.controller.js

const purchaseReturnService = require('../services/purchaseReturn.service');

exports.createPurchaseReturn = async (req, res) => {
  try {
    const result = await purchaseReturnService.createPurchaseReturn(
      req.body,
      req.user
    );

    res.status(200).json({
      success: 1,
      data: result
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};

exports.getAllPurchaseReturns = async (req, res) => {
  try {
    const data = await purchaseReturnService.getAllPurchaseReturns();

    res.status(200).json({
      success: 1,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};

exports.getPurchaseReturnByStockEntry = async (req, res) => {
  try {
    const data =
      await purchaseReturnService.getPurchaseReturnByStockEntry(
        req.params.stockEntryId
      );

    res.status(200).json({
      success: 1,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};