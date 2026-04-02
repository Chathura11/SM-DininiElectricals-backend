// users.service.js
const {User} = require('../models/users.model');
const Role = require('../models/roles.model.js');

exports.register = async (data, callback) => {
  const newUser = new User({
    name: data.name,
    email: data.email,
    username: data.username,
    password: data.password,
    role:data.role,
  });

  newUser.save().then((results)=>{
    return callback(null,"User added successfully");
  }).catch((error)=>{
      return callback(error);
  })
};

exports.getAllUsers = async (req) => {
  try {
    const userRoleID = req.user.role; // Get logged-in user's role ID

    const roleDetails = await Role.findOne({ _id: userRoleID }); // Fetch role details

    if (!roleDetails) {
      throw new Error("Role not found");
    }

    let filter = {}; // Default: fetch all users

    if (roleDetails.role !== "superAdmin") {
      // If logged-in user is not superAdmin, exclude superAdmin users
      const superAdminRole = await Role.findOne({ role: "superAdmin" }); // Get superAdmin role ID
      if (superAdminRole) {
        filter = { role: { $ne: superAdminRole._id } }; // Exclude superAdmin users
      }
    }

    return await User.find(filter)
      .populate({
        path: "role",
        select: "role permissions",
        populate: {
          path: "permissions",
          select: "name",
        },
      })
      .select("-password");
  } catch (error) {
    throw error;
  }
};

exports.getUserByID = async (id, req) => {
  try {
    const loggedInUserRoleID = req.user.role; // Get the logged-in user's role ID

    // Fetch role details of the logged-in user
    const loggedInUserRole = await Role.findOne({ _id: loggedInUserRoleID });

    if (!loggedInUserRole) {
      throw new Error("Logged-in user role not found");
    }

    // Fetch the user by ID and populate role & permissions
    const userWithDetails = await User.findById(id)
      .populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permission",
          select: "name",
        },
      });

    if (!userWithDetails) {
      throw new Error("User not found");
    }

    // Fetch the superAdmin role ID
    const superAdminRole = await Role.findOne({ role: "superAdmin" });

    // Restrict access if logged-in user is not a superAdmin and the requested user is a superAdmin
    if (
      loggedInUserRole.role !== "superAdmin" &&
      superAdminRole &&
      userWithDetails.role._id.toString() === superAdminRole._id.toString()
    ) {
      throw new Error("Access denied. You are not allowed to view this user.");
    }

    // Prepare the response
    const userDetails = {
      _id: userWithDetails._id,
      name: userWithDetails.name,
      email: userWithDetails.email,
      username: userWithDetails.username,
      role: userWithDetails.role.role,
      permissions: userWithDetails.role.permissions.map((permission) => permission.name),
    };

    return userDetails;
  } catch (error) {
    throw error;
  }
};


exports.updateUser = async (id,userData)=>{
  try{
      return await User.findByIdAndUpdate(id,userData,{new:true});
  }catch(error){
      throw error;
  }
};

exports.deleteUser= async (id)=>{
  try{
      return await User.findByIdAndDelete(id);
  }catch(error){
      throw error;
  }
};
