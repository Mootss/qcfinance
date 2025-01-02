const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    unit: {
        type: String
    },
    gst: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    }
})

module.exports =  mongoose.model("Expense", expenseSchema)