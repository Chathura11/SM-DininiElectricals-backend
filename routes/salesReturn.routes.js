const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturn.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');


router.post('/', isAuthenticated,checkPermission('process_returns'), salesReturnController.handleReturn);
router.get('/by-transaction/:transactionId',isAuthenticated,checkPermission('process_transaction'),isAuthenticated, salesReturnController.getReturnsByTransaction);
router.get('/',isAuthenticated,checkPermission('process_transaction'), isAuthenticated,salesReturnController.getAllSalesReturns);

module.exports = router;