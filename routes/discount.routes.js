const express = require('express');
const discountRouter = express.Router();
const {CreateDiscount,GetAllDiscounts} = require('../controllers/discount.controller')
const {isAuthenticated,checkPermission} = require('../middleware/middleware')

discountRouter.post('/',isAuthenticated,checkPermission('configure_settings'),CreateDiscount);

discountRouter.get('/',isAuthenticated,GetAllDiscounts);

module.exports = discountRouter;