const Discount = require('../models/discount.model');

exports.CreateDiscount = async (data)=>{
    try {
        const discount = new Discount(data);
        return await discount.save();
    } catch (error) {
        throw error;
    }
}

exports.GetAllDiscounts = async(req)=>{
    try {
        const user = req.user;
        const requiredPermission = 'configure_settings';
        const permissionNames = user.role.permissions.map(permission => permission.name);
        if(permissionNames && permissionNames.includes(requiredPermission)){
            return await Discount.find();
        }else{
            return await Discount.find({status:true});
        }
    } catch (error) {
        throw error;
    }
}