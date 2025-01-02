const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    discount: {
        type: Number, 
        default: 0
    },
    total: {
        type: Number,
        required: true
    }
})

module.exports =  mongoose.model("Sale", saleSchema)