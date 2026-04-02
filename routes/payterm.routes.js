const express = require('express');
const paytermRouter = express.Router();
const {isAuthenticated,checkPermission} = require('../middleware/middleware')
const {CreatePayTerm,GetAllPayTerms} = require('../controllers/payterm.controller')

//create terms
paytermRouter.post('/',isAuthenticated,checkPermission('configure_settings'),CreatePayTerm);

paytermRouter.get('/',isAuthenticated,GetAllPayTerms);

module.exports = paytermRouter;