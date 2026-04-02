const Supplier =require ('../models/supplier.model.js');

exports.AddSupplier = async (data)=>{
    try {
        const supplier = new Supplier(data);
        return await supplier.save();
    } catch (error) {
        throw error;
    }
}

exports.GetAllSuppliers = async (req)=>{
    try {
        return await Supplier.find().populate("paymentTerm");
    } catch (error) {
        throw error;
    }
}

exports.UpdateSupplier = async (id,data)=>{
    try {
        return await Supplier.findByIdAndUpdate(id,data,{new:true})
    } catch (error) {
        throw error;
    }
}