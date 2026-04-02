const express = require('express');
const productRouter = express.Router();
const {CreateProduct,GetAllProducts,UpdateProduct} = require('../controllers/product.controller');
const {isAuthenticated,checkPermission} = require('../middleware/middleware');

productRouter.post('/',isAuthenticated,checkPermission('configure_settings'),CreateProduct);

productRouter.get('/',isAuthenticated,GetAllProducts);

productRouter.put('/:id',isAuthenticated,checkPermission('configure_settings'),UpdateProduct);

module.exports = productRouter;