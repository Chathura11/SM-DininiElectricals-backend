const express = require('express');
const router = express.Router();
const { CreateStockEntry,GetAllStockEntries,GetAllStockEntryItems,getFIFOCost,getAllStockEntriesDetailed,deleteStockEntry } = require('../controllers/stockEntry.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');

router.post('/stock-entries',isAuthenticated,checkPermission('manage_inventory'), CreateStockEntry);

// routes/stockEntryRoutes.js
router.delete('/:id', isAuthenticated,checkPermission('manage_inventory'), deleteStockEntry);

router.get('/stock-entries',isAuthenticated, GetAllStockEntries);

router.get('/stock-entries-detailed',isAuthenticated, getAllStockEntriesDetailed);

router.get('/stock-entryItems',isAuthenticated, GetAllStockEntryItems);

router.get('/fifo-cost',isAuthenticated, getFIFOCost);

module.exports = router;