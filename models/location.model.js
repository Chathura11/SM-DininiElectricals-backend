const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique: true
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    },

    remark:{
        type:String,
        required:false
    }
},{timestamps:true});

const Location = mongoose.model('Location',locationSchema);

module.exports = Location;