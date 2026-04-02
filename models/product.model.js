const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    id:{
        type:Number,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true,
    },
    code:{
        type:String,
        required:true,
        unique:true
    },
    price:{
        type:Number,
        required:true,
        default:0
    },
    discount:{
        type:Number,
        required:false,
        default:0
    },
    description:{
        type:String,
        required:false
    },
    brand:{
        type:String,
        required:true,
        ref:"Brand"
    },
    category:{
        type:String,
        required:true,
        ref:"Category"
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    },
    imageURL:{
        type:String,
        required:false,
    },
    remark:{
        type:String,
        required:false
    }

}, { timestamps: true })

const Product = mongoose.model('Product',productSchema);

module.exports = Product;