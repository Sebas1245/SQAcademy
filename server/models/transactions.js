const mongoose = require('mongoose');

let transactionSchema = new mongoose.Schema({
    kind: { // it can be either a payment or a charge
        type: String,
        required: [true, "The kind of transaction is unknown"]
    },
    referenceTo: { // stores who the transaction is for
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, "No reference to who made the payment"]
    },
    amount: Number,
    date: Date,
    description: String
});

module.exports = mongoose.model("Transaction", transactionSchema);