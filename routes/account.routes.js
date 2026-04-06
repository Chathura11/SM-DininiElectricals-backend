const express = require('express');
const router = express.Router();
const {purchaseStock,sellProduct,addAssetMoney,addExpense,getAllAccounts,getAllJournalEntries,getMoneyAssets,getExpenses,getAnalytics} = require('../controllers/account.controller.js');
const { isAuthenticated, checkPermission } = require('../middleware/middleware.js');

router.post('/purchase',isAuthenticated,checkPermission('manage_inventory'), purchaseStock);//this route is called in stockEntry service
router.post('/sale',isAuthenticated,checkPermission('process_transaction'), sellProduct);//this route is called in salesTransaction service
router.post('/add-asset',isAuthenticated,checkPermission('access_financial_data'), addAssetMoney);
router.get('/money-assets',isAuthenticated,checkPermission('access_financial_data'), getMoneyAssets);
router.post('/add-expense',isAuthenticated,checkPermission('access_financial_data'), addExpense);
router.get('/expenses',isAuthenticated,checkPermission('access_financial_data') ,getExpenses);
router.get('/all',isAuthenticated,checkPermission('access_financial_data'),getAllAccounts);
router.get('/journal-list',isAuthenticated,checkPermission('access_financial_data'), getAllJournalEntries);
router.get('/analytics',isAuthenticated,checkPermission('access_financial_data'),getAnalytics);

module.exports = router;