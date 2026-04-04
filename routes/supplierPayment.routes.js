// routes/supplierPayment.routes.js

const router = require('express').Router();
const controller = require('../controllers/supplierPayment.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');

router.post('/',isAuthenticated, controller.makePayment);
router.get('/',isAuthenticated, controller.getAllPayments);
router.get('/due/:supplierId', isAuthenticated,controller.getSupplierDue);

module.exports = router;