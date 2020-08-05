const mongoose = require('mongoose');

let studetSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    class: String,
    paymentCycle: String,
    classStart: Date,
    additionalAmount: Number,
    additionalAmountDescription: String,
    additionalAmountDeadline: Date,
    lateWithPayment: Boolean
})

module.exports = mongoose.model("Student", studetSchema);