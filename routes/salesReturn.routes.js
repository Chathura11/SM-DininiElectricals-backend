const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturn.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');


router.post('/', isAuthenticated, salesReturnController.handleReturn);
router.get('/by-transaction/:transactionId',isAuthenticated, salesReturnController.getReturnsByTransaction);
router.get('/', isAuthenticated,salesReturnController.getAllSalesReturns);

module.exports = router;