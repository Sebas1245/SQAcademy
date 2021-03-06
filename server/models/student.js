const mongoose = require('mongoose');

function buildErrString(fieldName) {
    return "Debe introducir " + fieldName + " para el alumno";
}

let studetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, buildErrString("un nombre")]
    },
    email: {
        type: String,
        required: [true, buildErrString("un correo electrónico")]
    },
    phone: {
        type: String,
        required: [true, buildErrString("un número de teléfono")]
    },
    classGroup: {
        type: String,
        required: [true, buildErrString("un grupo de clase")]
    },
    paymentAmount: {
        type: Number,
        required: [true, buildErrString("un monto a pagar")]
    },
    paymentCycle: {
        type: String, 
        required: [true,buildErrString("un ciclo de pago")]
    },
    firstClass: {
        type: Date,
        required: [true, buildErrString("una fecha para la primera clase")]
    },
    additionalAmount: {
        type: Number,
        required: [false, '']
    },
    additionalAmountDescription: {
        type: String,
        required: [false, '']
    },
    additionalAmountDeadline:{
        type: Date,
        required: [false, '']
    },
    isActive: {
        type: Boolean,
        required: [false, '']
    },
    balance: {
        type: Number,
        required: [false, '']
    },
    additionalBalance: {
        type: Number,
        required: [false,'']
    },
    lastPaymentMade: {
        type: Date,
        required: [false, '']
    },
    paymentDeadline: {
        type: Date,
        required: [true, 'No se pudo calcular una fecha límite para el pago de la clase']
    },
    paymentLate: {
        type: Boolean,
        required: [true, 'No se sabe si el alumno está al dia con sus pagos.']
    }
})

module.exports = mongoose.model("Student", studetSchema);