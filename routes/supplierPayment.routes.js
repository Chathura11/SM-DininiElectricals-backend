// routes/supplierPayment.routes.js

const router = require('express').Router();
const controller = require('../controllers/supplierPayment.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');

router.post('/',isAuthenticated,checkPermission('access_financial_data'), controller.makePayment);
router.get('/',isAuthenticated,checkPermission('access_financial_data'), controller.getAllPayments);
router.get('/due/:supplierId',isAuthenticated,checkPermission('access_financial_data'),controller.getSupplierDue);

module.exports = router;