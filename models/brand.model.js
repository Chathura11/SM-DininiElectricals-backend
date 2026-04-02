const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique: true
    },

    description:{
        type:String,
        required:false
    },

    imageURL:{
        type:String,
        required:false,
    },

    status:{
        type:Boolean,
        required:true
    },

    remark:{
        type:String,
        required:false
    }
}, { timestamps: true })


const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;