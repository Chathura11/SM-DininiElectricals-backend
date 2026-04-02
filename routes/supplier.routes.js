const express = require('express');
const supplierRouter = express.Router();
const {AddSupplier,GetAllSuppliers,UpdateSupplier} = require('../controllers/supplier.controller') 
const { isAuthenticated, checkPermission } = require('../middleware/middleware');


//add suplier
supplierRouter.post('/',isAuthenticated,checkPermission('configure_settings'), AddSupplier);

//get all suppliers
supplierRouter.get('/',isAuthenticated,GetAllSuppliers)

supplierRouter.put('/:id',isAuthenticated,checkPermission('configure_settings'), UpdateSupplier);



module.exports = supplierRouter;
