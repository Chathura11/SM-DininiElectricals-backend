const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { isAuthenticated, checkPermission } = require('../middleware/middleware');


// Create a new Brand
router.post('/',isAuthenticated,checkPermission('configure_settings'), brandController.createBrand);

// Get all Brands
router.get('/',isAuthenticated, brandController.getAllBrands);

// Get a Brand by ID
router.get('/:id',isAuthenticated, brandController.getBrandByID);

// Update a Brand
router.put('/:id',isAuthenticated,checkPermission('configure_settings'), brandController.updateBrand);

// Delete a Brand
router.delete('/:id',isAuthenticated,checkPermission('configure_settings'), brandController.deleteBrand);

module.exports = router;