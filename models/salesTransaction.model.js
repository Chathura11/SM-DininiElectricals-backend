const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const salesTransactionSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // staff who made the sale
    customerName: { 
        type: String 
    }, // optional field for walk-in or named customer
    totalAmount: { 
        type: Number, 
        required: true 
    }, // total sale price
    totalProfit: { 
        type: Number, 
        required: true 
    }, // calculated profit
    discount: {
        type: Number,
        default: 0
    },
    paymentMethod: { 
        type: String, 
        enum: ['Cash', 'Card', 'Online'], 
        default: 'Cash' 
    },
    status: { 
        type: String, 
        enum: ['Completed', 'Cancelled','Pending','Free'], 
        default: 'Completed' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    reversedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    reversedAt: { 
        type: Date 
    }
}, { timestamps: true });

module.exports = mongoose.model('SalesTransaction', salesTransactionSchema);