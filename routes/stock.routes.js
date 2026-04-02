const express = require('express');
const router = express.Router();
const { CreateStockEntry,GetAllStockEntries,GetAllStockEntryItems,getFIFOCost,getAllStockEntriesDetailed } = require('../controllers/stockEntry.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');

router.post('/stock-entries',isAuthenticated, CreateStockEntry);

router.get('/stock-entries',isAuthenticated, GetAllStockEntries);

router.get('/stock-entries-detailed',isAuthenticated, getAllStockEntriesDetailed);

router.get('/stock-entryItems',isAuthenticated, GetAllStockEntryItems);

router.get('/fifo-cost',isAuthenticated, getFIFOCost);

module.exports = router;