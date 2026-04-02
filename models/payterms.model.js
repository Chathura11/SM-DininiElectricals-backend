const mongoose= require('mongoose');

const Schema = mongoose.Schema;

const paymentTermSchema = new Schema({
    description:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    }
}, { timestamps: true });

const PayTerm = mongoose.model('PayTerm',paymentTermSchema);

module.exports = PayTerm;