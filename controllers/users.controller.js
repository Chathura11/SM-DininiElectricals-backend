const userService = require('../services/users.service');
const {User,validate} = require('../models/users.model');
const bcrypt = require('bcrypt');
const joi = require('joi');
const Role = require('../models/roles.model');

exports.register = async(req,res,next)=>{
    //validate
    try {
        const {error} = validate(req.body);

        if(error){
            return res.status(400).send({success:0,data:error.details[0].message});
        }
        const user = await User.findOne({email:req.body.email});
        if(user){
            return res.status(409).send({success:0,data:"User with given email alredy exist! "});

        }
        const role = await Role.findOne({ role: req.body.role });
        if (!role) {
            return res.status(409).send({success:0,data:"Role not found"});
        }

        const salt =await  bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword =await  bcrypt.hash(req.body.password,salt);

        const data ={
            name:req.body.name,
            email:req.body.email,
            username:req.body.username,
            password:hashPassword,
            role:role._id,
        }

        userService.register(data,(error,results)=>{
            if(error){
                console.log(error)
                return res.status(400).send({success:0,data:'Bad request!'});
            }

            return res.status(200).send({success:1,data:results});
        })
        
    } catch (error) {

        console.log(error)
        return res.status(500).send({success:0,data:"Internal Server Error!"});
    }
}

//login
exports.login = async(req,res,next)=>{
    //validate

    const validate =(data)=>{
        const schema = joi.object({
            username:joi.string().required().label("Username"),
            password:joi.string().required().label("Password")
        })

        return schema.validate(data);
    }
    try {
        const {error} = validate(req.body);

        if(error){
            return res.status(400).send({success:0,data:error.details[0].message});
        }
        const user = await User.findOne({username:req.body.username})
            .populate('role')
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission',
                    select: 'name',
                },
            });
        if(!user){
            return res.status(401).send({success:0,data:"Invalid username or password!"});
        }
        const validPassword =await bcrypt.compare(
            req.body.password,user.password
        );

        if(!validPassword){
            return res.status(401).send({success:0,data:"Invalid username or password!"});
        }

        const token = user.generateAuthToken(user);
        // Save the token in a cookie
        res.cookie('authToken', token,{
            httpOnly: true,
            secure: true, // Ensure Secure flag is set for HTTPS
            sameSite: "None", // Allow cross-origin requests
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.status(200).send({ success: 1, data: "user logged in successfully!" });
    } catch (error) {
        console.log(error)
        return res.status(500).send({success:0,data:"Internal Server Error"});
    }
}

//get auth user
exports.getUser = async (req, res, next) => {
    try {
        if (req.user) {
            const userId = req.user._id;

            // Fetch the user details including role and permissions
            const userWithDetails = await User.findById(userId)
                .populate('role') // Populate role details
                .populate({
                    path: 'role',
                    populate: {
                        path: 'permissions',
                        model: 'Permission',
                        select: 'name',
                    },
                });

            if (!userWithDetails) {
                return res.status(401).send({ success: 0, data: 'Unauthorized' });
            }

            const userDetails = {
                _id: userWithDetails._id,
                name: userWithDetails.name,
                email: userWithDetails.email,
                username: userWithDetails.username,
                role: userWithDetails.role.role,
                permissions: userWithDetails.role.permissions.map(permission => permission.name),
            };

            res.status(200).send({ success: 1, data: userDetails });
        } else {
            res.status(401).send({ success: 0, data: 'Unauthorized' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: 0, data: 'Internal Server Error' });
    }
};

// Logout route
exports.logout = function (req, res) {
    // Clear the authentication cookie
    res.clearCookie('authToken',{
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    });

    res.status(200).send({ success: 1, data: 'Logout successful' });
};

//get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers(req);
        res.status(200).json({ success: 1, data: users });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};


exports.getUserByID = async (req,res) =>{
    try{
        const user = await userService.getUserByID(req.params.id,req);
        if(!user){
            return res.status(404).json({ success: 0, message: "User not found" });
        }
        res.status(200).json({success:1,data:user});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
}

exports.updateUser = async (req, res, next) => {
    try {
        const { error } = validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).send({ success: 0, data: error.details[0].message });
        }

        const userId = req.params.id;
        const loggedInUserRoleID = req.user.role; // Get logged-in user's role

        // Fetch role details of the logged-in user
        const loggedInUserRole = await Role.findById(loggedInUserRoleID);
        if (!loggedInUserRole) {
            return res.status(403).send({ success: 0, data: "Access denied" });
        }

        // Fetch the user to be updated
        const userToUpdate = await User.findById(userId).populate("role");
        if (!userToUpdate) {
            return res.status(404).send({ success: 0, data: "User not found" });
        }

        // Fetch the superAdmin role ID
        const superAdminRole = await Role.findOne({ role: "superAdmin" });

        // Restrict updates if logged-in user is not a superAdmin and is trying to update a superAdmin
        if (
            loggedInUserRole.role !== "superAdmin" &&
            superAdminRole &&
            userToUpdate.role._id.toString() === superAdminRole._id.toString()
        ) {
            return res.status(403).send({ success: 0, data: "Access denied. You cannot update a superAdmin user." });
        }

        // If updating role, ensure the role exists
        if (req.body.role) {
            const role = await Role.findOne({ role: req.body.role });
            if (!role) {
                return res.status(404).send({ success: 0, data: "Role not found" });
            }
            req.body.role = role._id;
        }

        // If updating password, hash it
        if (req.body.password) {
            const salt = await bcrypt.genSalt(Number(process.env.SALT));
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        // Update the user
        const updatedUser = await userService.updateUser(userId, req.body);

        return res.status(200).send({ success: 1, data: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).send({ success: 0, data: "Internal Server Error" });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const loggedInUserRoleID = req.user.role; // Get the logged-in user's role ID

        // Fetch role details of the logged-in user
        const loggedInUserRole = await Role.findById(loggedInUserRoleID);
        if (!loggedInUserRole) {
            return res.status(403).json({ success: 0, message: "Access denied" });
        }

        // Fetch the user to be deleted
        const userToDelete = await User.findById(userIdToDelete).populate("role");
        if (!userToDelete) {
            return res.status(404).json({ success: 0, message: "User not found" });
        }

        // Fetch the superAdmin role ID
        const superAdminRole = await Role.findOne({ role: "superAdmin" });

        // Restrict deletion if logged-in user is not a superAdmin but is trying to delete a superAdmin user
        if (
            loggedInUserRole.role !== "superAdmin" &&
            superAdminRole &&
            userToDelete.role._id.toString() === superAdminRole._id.toString()
        ) {
            return res.status(403).json({ success: 0, message: "Access denied. You cannot delete a superAdmin user." });
        }

        // Delete the user
        const deletedUser = await userService.deleteUser(userIdToDelete);
        if (!deletedUser) {
            return res.status(404).json({ success: 0, message: "User not found" });
        }

        res.status(200).json({ success: 1, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};