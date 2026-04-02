const { AddSupplier,GetAllSuppliers,UpdateSupplier } = require("../services/supplier.service.js");

exports.AddSupplier = async (req,res)=>{
    try {
        const supplier = await AddSupplier(req.body);
        res.status(200).json({success:1,data:supplier.id});
    } catch (error) {
        res.status(500).json({success:0,data:error.message}); 
    }
};

exports.GetAllSuppliers = async(req,res)=>{
    try {
        const suppliers = await GetAllSuppliers(req);
        res.status(200).json({success:1,data:suppliers});
    } catch (error) {
        res.status(500).json({success:0,data:error.message}); 
    }
};

exports.UpdateSupplier = async(req,res)=>{
    try {
        const updatedSupplier= await UpdateSupplier(req.params.id,req.body);
        if(!updatedSupplier){
            return res.status(404).json({ success: 0, message: "Supplier not found" });
        }
        res.status(200).json({success:1,data:UpdateSupplier});
    } catch (error) {
        res.status(500).json({success:0,data:error.message}); 
    }
}