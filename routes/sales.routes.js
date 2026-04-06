const express = require('express');
const router = express.Router();
const { createTransactionController,getAllTransactionsController,reverseTransaction,markTransactionCompleted,getSalesTransactionById } = require('../controllers/salesTransaction.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');

router.post('/', isAuthenticated,checkPermission('process_transaction'),createTransactionController);

router.get('/',isAuthenticated,checkPermission('process_transaction'), getAllTransactionsController);

router.get('/:id',isAuthenticated,checkPermission('process_transaction'), getSalesTransactionById);

router.put('/reverse/:id',isAuthenticated,checkPermission('process_returns'), reverseTransaction);

router.put('/mark-completed/:id',isAuthenticated,checkPermission('process_transaction'),  markTransactionCompleted);

module.exports = router;