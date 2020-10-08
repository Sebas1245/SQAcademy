const student = require('./models/student');
const transactions = require('./models/transactions');
const { update, create } = require('./models/student');
const { urlencoded } = require('body-parser');

require('dotenv').config();

const   express = require('express'),
        path = require('path'),
        mongoose = require('mongoose'),
        cors = require('cors'),
        passport = require('passport'),
        passportLocal = require('passport-local').Strategy,
        cookieParser = require('cookie-parser'),
        bcrypt = require('bcryptjs'),
        session = require('express-session'),
        bodyParser = require('body-parser'),
        app = express(),
        User = require('./models/user'),
        Student = require('./models/student'),
        Transaction = require('./models/transactions'),
        PORT = process.env.PORT || 5000;


let uri = process.env.NODE_ENV === 'dev' ? (process.env.MONGODB_URI_TEST) : (process.env.MONGODB_URI)        
mongoose.connect(
    uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    },
    () => {
        console.log("DB is connected")
    }
)

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: "http://localhost:3000", // location of the react app we are connecting to
    credentials: true
}));

app.use(session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true
}));

app.use(cookieParser("mysecret"));
app.use(passport.initialize());
app.use(passport.session());
require('./passportConfig')(passport);

// ----------------- END OF MIDDLEWARWE --------------------------


/**
 * Sets up admin if not created
 * @return {adminUser}
 */
function adminSetup() {
    return new Promise((resolve, reject) => {
      User.findOne({role: "admin", username: process.env.ADMIN_USERNAME},
          (err, admin) =>{
            if (err) return reject(err);
            if (admin) return resolve();
            if (!admin) {
                const nonHashedPw = process.env.ADMIN_PW;
                bcrypt.hash(nonHashedPw, 10, (err, hash) => {
                    if (err) throw err;
                    const newUser = new User({
                        username: process.env.ADMIN_USERNAME,
                        password: hash,
                        role: "admin",
                    });
                    newUser.save((err, createdUser) => {
                      if (err) return reject(err);
                      console.log('Admin created');
                      return resolve(createdUser);
                    });
                }); 
            }
          });
    });
};

// Serves build
app.use(express.static(path.resolve('../client/build')));

// Authentication route
app.post("/login", function(req, res, next){
    passport.authenticate("local", (err, user, info) => {
        if (err) throw err; 
        if (!user) res.status(401).send({msg: 'Error de autenticación'});
        else{
            req.logIn(user, err => {
                if(err) throw err; 
                res.send({msg: 'success'});
                console.log(req.user);
            })
        }
    })(req, res, next)
});

// ---------------------- ADMIN ROUTES ------------------------------------ 

// Get all students 
app.get("/admin/get_all_students", function(req,res,next){
    let allStudentsInfo = [];
    let lateStudents = getStudentsWithOverduePayments();
    Student.find({}, (err,allStudents) => {
        if(err) {
            res.status(500).send({err: err});
            throw err;
        }
        allStudents.forEach((student) => {
            let formattedLastPaymentMade = (student.lastPaymentMade != null) ? (student.lastPaymentMade.toLocaleDateString()) : ('Sin pagos'); 
            let formattedCycle = student.paymentCycle;
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
                cycle: formattedCycle,
                lastPaymentMade: formattedLastPaymentMade,
            };
            allStudentsInfo.push(studentInfo);
        })
        
        console.log('late students array ' + lateStudents);
        res.send({msg: 'success', allStudents: allStudentsInfo, lateStudents: lateStudents })
    });
});

// Get transactions for a specific student
app.get("/admin/get_all_students/get_transactions/:student_id", function(req,res,next){
    const studentId = req.params.student_id;
    Transaction.find({referenceTo: studentId},(err, allTransactionsForStudent) => {
        if(err) throw err;
        console.log(allTransactionsForStudent);
        res.send({msg: 'success', allTransactions: allTransactionsForStudent})
    })
});

// Register student post route
app.post("/admin/register_student", function(req,res,next) {
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
        paymentDeadline: paymentDeadline
    });

    newStudent.save((err, createdStudent) => {
        if(err) {
            res.status(500).send({error: 'Error al crear al alumno'});
            throw err;
        }
        if(firstPaymentAmount === 0) {
            console.log('createdStudent: ' + createdStudent);
            res.send({msg: 'success', createdStudent: createdStudent});
        }
        // save a new transaction if incoming student has already made a payment
        else if(firstPaymentAmount > 0){
            createTransaction('payment',newStudent._id, firstPaymentAmount,firstPaymentDate, "Pago inicial de clases juno con inscripción");
            console.log('createdStudent: ' + createdStudent);
            res.send({msg: 'success', createdStudent: newStudent})
        }
        else{
            res.status(500).send({error: 'Error de servidor al crear al alumno'})
        }
        });
});

// Register transaction for a student route
app.post("/admin/register_student_payment", function (req,res,next) {    
    const { refersTo, amount, date, identifier } = req.body;
    let previousBalance;
    if(identifier === 'ClassPayment') {
        createTransaction('payment', refersTo, amount, date, 'Abono a lo que se debe por las clases.');
        Student.findById(refersTo, (err, student) => {
            if(err) throw err;
            console.log(student);
            previousBalance = student.balance;
            console.log(previousBalance);
            let newBalance = previousBalance - amount;
            if(newBalance <= 0) {
                let payedCycles = amount / student.paymentAmount;
                let newDeadline = student.paymentDeadline; 
                for(i = 0; i < payedCycles; i++){
                    newDeadline = getDateAfterCycle(student.paymentCycle, new Date (newDeadline));
                }
                Student.findOneAndUpdate({_id: refersTo}, {balance: newBalance,paymentDeadline: newDeadline ,lastPaymentMade: date}, {new: true},
                    (err, updatedStudent) => {
                    if(err) throw err;
                    console.log(updatedStudent);
                    res.send({msg: 'success'});
                })
            }
            else {
                Student.findOneAndUpdate({_id: refersTo}, {balance: newBalance, lastPaymentMade: date}, {new: true}, 
                    (err, updatedStudent) => {
                    if(err) throw err;
                    console.log(updatedStudent);
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
                console.log(updatedStudent);
                res.send({msg: 'success'});
            })
        })
    }
});

function getStudentsWithOverduePayments(){
    let lateStudents = [];
    // first we update the info of all of the late students
    Student.find({},(err,allStudents) => {
        if(err) throw err;
        allStudents.forEach((student) => {
            let today = new Date();
            let deadline = student.paymentDeadline; 
            let cycle = student.paymentCycle;
            if(today >= deadline) {
                console.log("Enters if today >= student payment deadline");
                console.log(student);
                // get the difference between today and the deadline to know how many times it must be recalculated and how many charges should be drawn for the student
                let dateDiff = differenceBetweenDates(cycle,new Date(today), new Date(deadline)); 
                console.log('date diff is ' + dateDiff);
                let chargeAmounts = 0;
                let newDeadline = deadline;
                console.log(newDeadline);
                while(dateDiff >= 0){
                    createTransaction('charge',student._id, student.paymentAmount, new Date(), 'Cargo por retraso en pago de clase');
                    chargeAmounts += student.paymentAmount;
                    newDeadline = getDateAfterCycle(cycle, new Date(newDeadline));
                    dateDiff--;
                } 
                let newBalance = student.balance + chargeAmounts;
                Student.findOneAndUpdate({_id: student._id}, {balance: newBalance,paymentDeadline: newDeadline }, {new: true},
                    (err, updatedStudent) => {
                    if(err) throw err;
                    console.log('student info after charges and updated deadline' + updatedStudent);
                })
                console.log(student)
                lateStudents.push(student);
            }
            // else if the student's additional balance is greater than 0 and the deadline exceeds today
            else if(student.additionalBalance && student.additionalAmountDeadline >= today) {
                lateStudents.push(student);
            }
        });
        console.log("late students array inside function: ");
        console.log(lateStudents);
        
    });
    return lateStudents;
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
// -------------------------------------------------------------------------------------------------------------------------------


// middleware
function isLoggedIn(req,res,next){
    if (req.isAuthenticated()){
        return next();
    }
    throw console.error("User is not authenticated");
}
// Redirects everything else to index
app.get('/', (req, res) => {
    res.sendFile(path.resolve('../client/build/index.html'));
  });
  
app.get('/*', (req,res) => {
  res.sendFile(path.resolve('../client/build/index.html'));
})

app.listen(PORT, () => {
    adminSetup();
    console.log("App is working on PORT " + PORT);
});