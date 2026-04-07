const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware.js');

router.get('/',isAuthenticated,checkPermission('process_transaction'), loanController.getLoans);
router.get('/:loanId/payments',isAuthenticated,checkPermission('process_transaction'),  loanController.getLoanPayments);
router.post('/pay',isAuthenticated,checkPermission('process_transaction'),  loanController.payLoan);

module.exports = router;