const PayTerm = require('../models/payterms.model');

exports.CreatePayTerm = async (data)=>{
    try {
        const payTerm = new PayTerm(data);
        return payTerm.save();
    } catch (error) {
        throw error;
    }
}

exports.GetAllPayTerms = async ()=>{
    try {
        return await PayTerm.find();
    } catch (error) {
        throw error;
    }
}