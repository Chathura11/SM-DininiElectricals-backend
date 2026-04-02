const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stockEntrySchema = new Schema({
    supplier: { 
        type: Schema.Types.ObjectId, 
        ref: 'Supplier', 
        required: true 
    },
    invoiceNumber: { 
        type: String 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    totalAmount: {
        type: Number 
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true },
    location: { 
        type: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('StockEntry', stockEntrySchema);