// routes/purchaseReturn.routes.js

const express = require('express');

const router = express.Router();

const {
  createPurchaseReturn,
  getAllPurchaseReturns,
  getPurchaseReturnByStockEntry
} = require('../controllers/purchaseReturn.controller');

const {
  isAuthenticated,
  checkPermission
} = require('../middleware/middleware');

router.post(
  '/',
  isAuthenticated,
  checkPermission('manage_inventory'),
  createPurchaseReturn
);

router.get(
  '/',
  isAuthenticated,
  getAllPurchaseReturns
);

router.get(
  '/stock-entry/:stockEntryId',
  isAuthenticated,
  getPurchaseReturnByStockEntry
);

module.exports = router;