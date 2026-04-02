const express = require('express');
const router = express.Router();
const { isAuthenticated, checkPermission } = require('../middleware/middleware');
const categoryController = require('../controllers/category.controller');

// Create a new Category
router.post('/',isAuthenticated,checkPermission('configure_settings'), categoryController.createCategory);

// Get all Categories
router.get('/',isAuthenticated, categoryController.getAllCategory);

// Get a Category by ID
router.get('/:id',isAuthenticated, categoryController.getCategoryByID);

// Update a Category
router.put('/:id',isAuthenticated,checkPermission('configure_settings'), categoryController.updateCategory);

// Delete a Category
router.delete('/:id',isAuthenticated,checkPermission('configure_settings'), categoryController.deleteCategory);

module.exports = router;