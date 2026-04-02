const jwt = require('jsonwebtoken');
require('dotenv').config()
const Role = require('../models/roles.model');
const Permission = require('../models/permissions.model');

//auth
exports.isAuthenticated = function (req, res, next) {
  if (req.cookies.authToken) {
      const token = req.cookies.authToken;

      jwt.verify(token, process.env.JWTPRIVATEKEY, (err, user) => {
          if (err) {
              res.clearCookie('authToken'); // Clear the cookie if verification fails
              return res.status(403).send({ success: 0, data: "Unauthorized" });
          }
          req.user =user;
          next();
      });
  } else {
      res.sendStatus(401);
      console.log("Error");
  }
};

// permission
exports.checkPermission = function (requiredPermission) {
  return async function (req, res, next) {
      try {
          if (!req.user || !req.user.role) {
              return res.status(403).send({ success: 0, data: 'Unauthorized' });
          }

          const userRole = await Role.findById(req.user.role);
          if (!userRole) {
              return res.status(403).send({ success: 0, data: 'Unauthorized' });
          }

          const permissionIds = userRole.permissions;

          // Fetch the actual Permission documents based on the ObjectId references
          const permissions = await Permission.find({ _id: { $in: permissionIds } });

          // Extract permission names
          const permissionNames = permissions.map(permission => permission.name);

          if (permissionNames.includes(requiredPermission)) {
              next();
          } else {
              res.status(403).send({ success: 0, data: 'Insufficient permissions' });
          }
      } catch (error) {
          console.error(error);
          res.status(500).send({ success: 0, data: 'Internal Server Error' });
      }
  };
};
