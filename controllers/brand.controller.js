const brandService = require('../services/brand.service');

exports.createBrand = async (req,res)=>{
    try{
        const brand = await brandService.createBrand(req.body);
        res.status(201).json({success:1,data:brand.id});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
};

exports.getAllBrands = async (req, res) => {
    try {
        const brands = await brandService.getAllBrands(req);
        res.status(200).json({ success: 1, data: brands });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};

exports.getBrandByID = async (req,res) =>{
    try{
        const brand = await brandService.getBrandByID(req.params.id);
        if(!brand){
            return res.status(404).json({ success: 0, message: "Brand not found" });
        }
        res.status(200).json({success:1,data:brand});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
}

exports.updateBrand = async (req,res) =>{
    try{
        const updatedBrand = await brandService.updateBrand(req.params.id,req.body);
        if(!updatedBrand){
            return res.status(404).json({ success: 0, message: "Brand not found" });
        }
        res.status(200).json({success:1,data:updatedBrand});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
}

exports.deleteBrand = async (req, res) => {
    try {
        const deletedBrand = await brandService.deleteBrand(req.params.id);
        if (!deletedBrand) {
            return res.status(404).json({ success: 0, message: "Brand not found" });
        }
        res.status(200).json({ success: 1, message: "Brand deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};