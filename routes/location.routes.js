const express = require('express');
const router = express.Router();
const {isAuthenticated, checkPermission} = require('../middleware/middleware');
const locationController = require('../controllers/location.controller');

// Create a new Location
router.post('/',isAuthenticated,checkPermission('configure_settings'), locationController.createLocation);

// Get all Locations
router.get('/',isAuthenticated, locationController.getAllLocations);

// Get a Location by ID
router.get('/:id',isAuthenticated, locationController.getLocationByID);

// Update a Location
router.put('/:id',isAuthenticated,checkPermission('configure_settings'), locationController.updateLocation);

// Delete a Location
router.delete('/:id',isAuthenticated,checkPermission('configure_settings'), locationController.deleteLocation);

module.exports = router;