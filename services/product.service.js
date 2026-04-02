const Product = require('../models/product.model');

exports.CreateProduct = async (data)=>{
    try {

        let id= 0;
        const products = await Product.find().sort({id:-1}).limit(1);

        if(products.length == 0){
            id = 1;
        }else{
            id = products[0].id +1;
        }
        data.id = id;

        const product = new Product(data);
        return await product.save();
    } catch (error) {
        throw error;
    }
}

exports.GetAllProducts = async(req)=>{
    try {
        const user = req.user;
        const requiredPermission = 'configure_settings';
        const permissionNames = user.role.permissions.map(permission => permission.name);
        if(permissionNames && permissionNames.includes(requiredPermission)){
            return await Product.find()
                                        .populate("brand")
                                        .populate("category")
        }else{
            return await Product.find({status:true})
                                                    .populate("brand")
                                                    .populate("category")
        }
    } catch (error) {
        throw error;
    }
}


exports.UpdateProduct = async (id,data)=>{
    try {
       return await Product.findByIdAndUpdate(id,data,{new:true}); 
    } catch (error) {
        throw error;
    }
}