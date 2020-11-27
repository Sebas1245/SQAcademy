const   express = require('express'),
        Student = require('../models/student'),
        Transaction = require('../models/transactions'),
        router = express.Router({mergeParams: true});

// Get all students 
router.get("/get_all_students", function(req,res,next){
    let lateStudents = []
    getStudentsWithOverduePayments()
    .then(overdueStudents => {
        return Student.find({}).exec();
    })
    .then(allStudents => {
        let allStudentsInfo = [];
        allStudents.forEach((student) => {
            let formattedLastPaymentMade = student.lastPaymentMade != null ? student.lastPaymentMade.toLocaleDateString() : 'Sin pagos'; 
            let formattedCycle = student.paymentCycle;
            let formattedDeadline = student.paymentLate ? 'Hoy' : student.paymentDeadline.toLocaleDateString();
            switch(formattedCycle) {
                case 'Weekly': 
                    formattedCycle = 'Semanal';
                    break;
                case 'Monthly': 
                    formattedCycle = 'Mensual';
                    break;
                case 'Quarterly': 
                    formattedCycle = 'Trimestral';
                    break;
                default:
                    break;
            }
            let studentInfo = {
                _id: student._id,
                name: student.name,
                phone: student.phone,
                email: student.email,
                group: student.classGroup,
                classBalance: student.balance,
                additionalBalance: student.additionalBalance,
                totalBalance: student.balance + student.additionalBalance,
                cycle: formattedCycle,
                lastPaymentMade: formattedLastPaymentMade,
                deadline: formattedDeadline
            };
            if(student.paymentLate){
                lateStudents.push(studentInfo);
            }
            allStudentsInfo.push(studentInfo);
        })
        return res.send({ msg: 'success', allStudents: allStudentsInfo, lateStudents: lateStudents })

    })
    .catch(err => next(err))
});

// Get transactions for a specific student
router.get("/get_all_students/get_transactions/:student_id", function(req,res,next){
    const studentId = req.params.student_id;
    Transaction.find({referenceTo: studentId},(err, allTransactionsForStudent) => {
        if(err) throw err;
        res.send({msg: 'success', allTransactions: allTransactionsForStudent})
    })
});

// Register student post route
router.post("/register_student", function(req,res,next) {
    let { 
        name, 
        email, 
        phone, 
        classGroup, 
        paymentAmount, 
        paymentCycle, 
        classStart, 
        firstPaymentDate,
        firstPaymentAmount, 
        additionalAmount, 
        additionalAmountDescription, 
        additionalAmountDeadline } = req.body;

    let balance = paymentAmount-firstPaymentAmount;
    let paymentDeadline = getDateAfterCycle(paymentCycle,new Date(classStart));
    const newStudent = new Student({
        name: name,
        email: email,
        phone: phone,
        classGroup: classGroup,
        paymentAmount: paymentAmount,
        paymentCycle: paymentCycle,
        firstClass: classStart,
        additionalAmount: additionalAmount,
        additionalAmountDescription: additionalAmountDescription,
        additionalAmountDeadline: additionalAmountDeadline,
        isActive: true,
        balance: balance,
        additionalBalance: additionalAmount,
        lastPaymentMade: firstPaymentDate,
        paymentDeadline: paymentDeadline,
        paymentLate: false
    });

    newStudent.save((err, createdStudent) => {
        if(err) {
            res.status(500).send({error: 'Error al crear al alumno'});
            throw err;
        }
        if(firstPaymentAmount === 0) {
            res.send({msg: 'success', createdStudent: createdStudent});
        }
        // save a new transaction if incoming student has already made a payment
        else if(firstPaymentAmount > 0){
            createTransaction('payment',newStudent._id, firstPaymentAmount,firstPaymentDate, "Pago inicial de clases junto con inscripción");
            res.send({msg: 'success', createdStudent: newStudent})
        }
        else{
            res.status(500).send({error: 'Error de servidor al crear al alumno'})
        }
        });
});

// Register transaction for a student route
router.post("/register_student_payment", function (req,res,next) {    
    const { refersTo, amount, date, identifier } = req.body;
    let previousBalance;
    if(identifier === 'ClassPayment') {
        createTransaction('payment', refersTo, amount, date, 'Abono a lo que se debe por las clases.');
        Student.findById(refersTo, (err, student) => {
            if(err) throw err;
            previousBalance = student.balance;
            let newBalance = previousBalance - amount;
            if(newBalance <= 0) {
                let payedCycles = amount / student.paymentAmount;
                let newDeadline = student.paymentDeadline; 
                for(i = 0; i < payedCycles; i++){
                    newDeadline = getDateAfterCycle(student.paymentCycle, new Date (newDeadline));
                }
                Student.findOneAndUpdate({_id: refersTo}, {balance: newBalance,paymentDeadline: newDeadline ,lastPaymentMade: date, paymentLate: false}, {new: true},
                    (err, updatedStudent) => {
                    if(err) throw err;
                    res.send({msg: 'success'});
                })
            }
            else {
                Student.findOneAndUpdate({_id: refersTo}, {balance: newBalance, lastPaymentMade: date}, {new: true}, 
                    (err, updatedStudent) => {
                    if(err) throw err;
                    res.send({msg: 'success'});
                })
            }
        })
    }
    else if(identifier === 'Additional'){
        let additionalDesc = '';
        Student.findById(refersTo, (err, student) => {
            if(err) throw err;
            previousBalance = student.additionalBalance;
            additionalDesc = student.additionalAmountDescription;
            createTransaction('payment', refersTo, amount, date, 'Pago del adeudo de ' + additionalDesc);
            let newBalance = previousBalance - amount;
            Student.findOneAndUpdate({_id: refersTo}, {additionalBalance: newBalance, lastPaymentMade: date}, {new: true},  (err, updatedStudent) => {
                if(err) throw err;
                res.send({msg: 'success'});
            })
        })
    }
});

function getStudentsWithOverduePayments(cb){
    return new Promise((resolve, reject) => {
        let today = new Date();
        Student.find(
            {
                $or:[
                    {
                        $and:[
                            {
                                paymentLate: false, 
                                $or:[{
                                    paymentDeadline: {$lte: today}
                                }, {
                                    additionalAmountDeadline: {$lte: today},
                                    additionalBalance: {$gt: 0}
                                },]
                            }
                        ]
                    },
                    {
                        $and:[{
                            paymentLate: true,
                            paymentDeadline: {$lte: today}
                        }]
                    }
            ]
                
            },(err,allStudents) => {
            if(err) return cb(err);
            const promises = allStudents.map(student => {
                return new Promise((resolve, reject) => {
                    let lStudentTransactions = [];
                    Transaction.find({referenceTo: student._id})
                    .then((transactions) => {
                        let lastTransactionMade = transactions[transactions.length-1]
                        if(lastTransactionMade.date.toDateString() == today.toDateString() && lastTransactionMade.kind == "charge") 
                            return resolve()
                        let deadline = student.paymentDeadline; 
                        let cycle = student.paymentCycle;
                        let update = {
                            paymentLate: true
                        }
                        if(today >= deadline) {
                            // get the difference between today and the deadline to know how many times it must be recalculated and how many charges should be drawn for the student
                            let dateDiff = differenceBetweenDates(cycle,new Date(deadline), new Date(today)); 
                            let chargeAmounts = 0;
                            let newDeadline = deadline;
                            let transactionObjs = [];
                            while(dateDiff > 0){
                                transactionObjs.push({
                                    kind: "charge",
                                    referenceTo: student._id,
                                    amount: student.paymentAmount,
                                    date: new Date(),
                                    description: "Cargo por retraso en el pago de la clase"
                                })
                                chargeAmounts += student.paymentAmount;
                                update.newDeadline = getDateAfterCycle(cycle, new Date(newDeadline));
                                dateDiff--;
                            } 
                            
                            update.balance = student.balance + chargeAmounts;
                            return Transaction.insertMany(transactionObjs)
                            .then(transactions => {
                                return Student.findOneAndUpdate({
                                    _id: student._id
                                }, update, {
                                    new: true
                                }).exec();
                            })
                            .then(updatedStudent => {
                                return resolve(updatedStudent)
                            })
                            .catch(err => reject(err))
                        } else if (student.additionalAmountDeadline <= today && student.additionalBalance > 0){
                            
                            return Student.findOneAndUpdate({
                                _id: student._id
                            },update, {
                                new: true
                            }).exec()
                            .then(student => resolve(student))
                            .catch(err => reject(err));
                        } else return reject(new Error(`Student with id ${student._id} passed query but not requirements`))
    
                    })
                    .catch((err) => {
                        return reject(err)
                    })
                    
                })
            })
            return Promise.all(promises)
            .then(students => resolve(students))
            .catch(err => reject(err));
        });
    })
    
    
};

function createTransaction(kind, referenceTo, amount, date, description){
    const newTransaction = new Transaction({
        kind: kind,
        referenceTo: referenceTo,
        amount: amount,
        date: date,
        description: description
    });
    newTransaction.save((err,createdTransaction) => {
        if(err) {
            res.status(500).send({error: err});
            throw err;
        }
    })
}

function getDateAfterCycle(cycle, recievedDate){
    let deadlineDate = recievedDate;
    switch(cycle){
        case 'Weekly':
            return deadlineDate.setDate(recievedDate.getDate()+7)
        case 'Monthly': 
            return deadlineDate.setMonth(recievedDate.getMonth()+1);
        case 'Quarterly':
            return deadlineDate.setMonth(recievedDate.getMonth()+3);
        default:
            return -1;
    }
}

function differenceBetweenDates(cycle, date1, date2){
    if(cycle === 'Weekly'){
        return weeksBetween(date1,date2);
    }
    else if(cycle === 'Monthly' || cycle == 'Quarterly'){
        return date2.getMonth()-date1.getMonth()
    }
}

const week = 7 * 24 * 60 * 60 * 1000;
const day = 24 * 60 * 60 * 1000;

function startOfWeek(dt) {
    const weekday = dt.getDay();
    return new Date(dt.getTime() - Math.abs(0 - weekday) * day);
}

function weeksBetween(d1, d2) {
    return Math.ceil((startOfWeek(d2) - startOfWeek(d1)) / week);
}

module.exports = router;