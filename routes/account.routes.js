const express = require('express');
const router = express.Router();
const {purchaseStock,sellProduct,addAssetMoney,addExpense,getAllAccounts,getAllJournalEntries} = require('../controllers/account.controller.js');
const { isAuthenticated, checkPermission } = require('../middleware/middleware.js');

router.post('/purchase',isAuthenticated, purchaseStock);//this route is called in stockEntry service
router.post('/sale',isAuthenticated, sellProduct);//this route is called in salesTransaction service
router.post('/add-asset',isAuthenticated, addAssetMoney);
router.post('/add-expense',isAuthenticated, addExpense);
router.get('/all', isAuthenticated,getAllAccounts);
router.get('/journal-list',isAuthenticated, getAllJournalEntries);

module.exports = router;