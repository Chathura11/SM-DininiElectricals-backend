const express = require('express');
const productRouter = express.Router();
const {CreateProduct,GetAllProducts,UpdateProduct,uploadExcelProducts} = require('../controllers/product.controller');
const {isAuthenticated,checkPermission} = require('../middleware/middleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

productRouter.post('/',isAuthenticated,checkPermission('configure_settings'),CreateProduct);

productRouter.get('/',isAuthenticated,GetAllProducts);

productRouter.put('/:id',isAuthenticated,checkPermission('configure_settings'),UpdateProduct);

// Excel upload route
productRouter.post('/upload-excel', upload.single('file'),isAuthenticated,checkPermission('configure_settings'), uploadExcelProducts);

module.exports = productRouter;