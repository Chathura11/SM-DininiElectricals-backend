const Brand = require('../models/brand.model');


exports.createBrand = async (brandData)=>{
    try{
        const brand = new Brand(brandData);
        return await brand.save();
    }catch(error){
        throw error;
    }
};

exports.getAllBrands = async (req)=>{
    try{
        const user = req.user;
        const requiredPermission = 'configure_settings';
        const permissionNames = user.role.permissions.map(permission => permission.name);
        if(permissionNames && permissionNames.includes(requiredPermission)){
            return await Brand.find();
        }else{
            return await Brand.find({status:true});
        }

        
    }catch(error){
        throw error;
    }
};

exports.getBrandByID = async (id)=>{
    try{
        return await Brand.findById(id);
    }catch(error){
        throw error;
    }
};

exports.updateBrand = async (id,brandData)=>{
    try{
        return await Brand.findByIdAndUpdate(id,brandData,{new:true});
    }catch(error){
        throw error;
    }
};

exports.deleteBrand = async (id)=>{
    try{
        return await Brand.findByIdAndDelete(id);
    }catch(error){
        throw error;
    }
};