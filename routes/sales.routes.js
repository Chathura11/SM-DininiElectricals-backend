const express = require('express');
const router = express.Router();
const { createTransactionController,getAllTransactionsController,reverseTransaction,markTransactionCompleted,getSalesTransactionById } = require('../controllers/salesTransaction.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');

router.post('/', isAuthenticated,createTransactionController);

router.get('/', isAuthenticated, getAllTransactionsController);

router.get('/:id',isAuthenticated, getSalesTransactionById);

router.put('/reverse/:id',isAuthenticated, reverseTransaction);

router.put('/mark-completed/:id',isAuthenticated,  markTransactionCompleted);

module.exports = router;