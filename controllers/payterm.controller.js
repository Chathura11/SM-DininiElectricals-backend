const {CreatePayTerm,GetAllPayTerms} = require('../services/payterm.service');

exports.CreatePayTerm = async (req,res)=>{
    try{
        const payTerm = await CreatePayTerm(req.body);
        res.status(200).json({success:1,data:payTerm.id});
    }catch(error){
        res.status(500).json({success:0,data:error.message});
    }
}

exports.GetAllPayTerms = async (req,res)=>{
    try {
        const payTerms = await GetAllPayTerms(req);
        res.status(200).json({success:1,data:payTerms});
    } catch (error) {
        res.status(500).json({success:0,data:error.message});
    }
}