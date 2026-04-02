const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discountSchema = new Schema({
    percentage:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:false
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    }
})

const Discount = mongoose.model('Discount',discountSchema);

module.exports = Discount;