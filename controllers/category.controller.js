const categoryService = require('../services/category.service');

exports.createCategory = async (req,res)=>{
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json({success:1,data:category.id});
    } catch (error) {
        res.status(500).json({success:0,message:error.message});
    }
};

exports.getAllCategory = async (req, res) => {
    try {
        const category = await categoryService.getAllCategory(req);
        res.status(200).json({ success: 1, data: category });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};

exports.getCategoryByID = async (req,res) =>{
    try{
        const category = await categoryService.getCategoryByID(req.params.id);
        if(!category){
            return res.status(404).json({ success: 0, message: "Category not found" });
        }
        res.status(200).json({success:1,data:category});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
}

exports.updateCategory = async (req,res) =>{
    try{
        const updatedCategory = await categoryService.updateCategory(req.params.id,req.body);
        if(!updatedCategory){
            return res.status(404).json({ success: 0, message: "Category not found" });
        }
        res.status(200).json({success:1,data:updatedCategory});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await categoryService.deleteCategory(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ success: 0, message: "Category not found" });
        }
        res.status(200).json({ success: 1, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};