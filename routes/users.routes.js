const usersController = require('../controllers/users.controller');
const middleware= require('../middleware/middleware')

var express = require('express');

var router = express.Router();

//register
router.post('/register',middleware.isAuthenticated,middleware.checkPermission('manage_users'),usersController.register);

//get all users
router.get('/all',middleware.isAuthenticated,middleware.checkPermission('manage_users'),usersController.getAllUsers);

//get user
router.get('/edit/:id',middleware.isAuthenticated,usersController.getUserByID);

//edit user
router.put('/edit/:id',middleware.isAuthenticated,usersController.updateUser);

//delete user
router.delete('/delete/:id',middleware.isAuthenticated,middleware.checkPermission('manage_users'),usersController.deleteUser);

//login
router.post('/login',usersController.login);

//authUser
router.get('/auth',middleware.isAuthenticated,usersController.getUser);

//logout
router.post('/logout',middleware.isAuthenticated,usersController.logout);


module.exports = router;