const {CreateProduct,GetAllProducts,UpdateProduct,processExcel} = require('../services/product.service');

exports.CreateProduct = async (req,res)=>{
    try {
        const product = await CreateProduct(req.body);
        res.status(200).json({success:1,data:product.id});
    } catch (error) {
        res.status(500).json({success:0,data:error.message})
    }
}

exports.GetAllProducts = async (req,res)=>{
    try {
        const products = await GetAllProducts(req);
        res.status(200).json({success:1,data:products})
    } catch (error) {
        res.status(500).json({success:0,data:error.message})
    }
}

exports.UpdateProduct = async (req,res)=>{
    try {
        const product = await UpdateProduct(req.params.id,req.body);
        if(!product){
            res.status(404).json({success:0,data:"Product not found"})
        }else{
            res.status(200).json({success:1,data:product.id})
        }
    } catch (error) {
        res.status(500).json({success:0,data:error.message})
    }
}

exports.uploadExcelProducts = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }
  
      const result = await processExcel(req.file);
  
      return res.status(200).json({
        success: true,
        message: "Products uploaded successfully",
        count: result.count
      });
  
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
