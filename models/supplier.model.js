const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const supplierSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    contactName:{
        type:String,
        required:false
    },
    nic:{
        type:String,
        required:false,
        unique:true
    },
    email:{
        type:String,
        required:false
    },
    phone:{
        type:String,
        required:false
    },
    address:{
        type:String,
        required:false
    },
    imageURL:{
        type:String,
        required:false,
        default:"https://static.vecteezy.com/system/resources/thumbnails/000/439/863/small_2x/Basic_Ui__28186_29.jpg"
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    },
    paymentTerm:{
        type:String,
        required:true,
        ref:"PayTerm"
    },
    creditLimit:{
        type:Number,
        required:false,
        default:0
    }

},{timestamps:true})


const Supplier = mongoose.model('Supplier',supplierSchema);

module.exports = Supplier;