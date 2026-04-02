const {CreateDiscount,GetAllDiscounts}= require('../services/discount.service')

exports.CreateDiscount = async (req,res)=>{
    try {
        const discount = await CreateDiscount(req.body);
        res.status(200).json({success:1,data:discount._id});
    } catch (error) {
        res.status(500).json({success:0,data:error.message});
    }
}

exports.GetAllDiscounts = async(req,res)=>{
    try {
        const discounts = await GetAllDiscounts(req);
        res.status(200).json({success:1,data:discounts});
    } catch (error) {
        res.status(500).json({success:0,data:error.message});
    }
}