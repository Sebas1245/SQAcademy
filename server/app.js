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
        useUnifiedTopology: true
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
    Student.find({}, (err,allStudents) => {
        if(err) {
            res.status(500).send({err: err});
            throw err;
        }
        allStudents.forEach((student) => {
            let formattedLastPaymentMade = student.lastPaymentMade.toLocaleDateString(); 
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
                balance: student.balance,
                cycle: formattedCycle,
                lastPaymentMade: formattedLastPaymentMade,
            };
            allStudentsInfo.push(studentInfo);
        })
        res.send({msg: 'success', allStudents: allStudentsInfo})
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
        lastPaymentMade: firstPaymentDate
    });

    newStudent.save((err, createdStudent) => {
        if(err) {
            res.status(500).send({error: 'Error al crear al alumno'});
            throw err;
        }
        if(firstPaymentAmount === 0 && additionalAmount === 0) {
            res.send({msg: 'success', createdStudent: createdStudent});
        }
    });
    // save a new transaction if incoming student has already made a payment
    if(firstPaymentAmount > 0){
        createTransaction('payment',newStudent._id, firstPaymentAmount,firstPaymentDate, "Pago inicial de clases junto con inscripción");
        res.send({msg: 'success', createdStudent: newStudent})
    }
    else{
        res.status(500).send({error: 'Error de servidor al crear al alumno'})
    }

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
            Student.findByIdAndUpdate(refersTo, {balance: newBalance}, (err, updatedStudent) => {
                if(err) throw err;
                console.log(updatedStudent);
                res.send({msg: 'success'});
            })
        })
    }
    else if(identifier === 'Additional'){
        let additionalDesc = '';
        Student.findById(refersTo, (err, student) => {
            if(err) throw err;
            previousBalance = student.balance;
            additionalDesc = student.additionalAmountDescription;
            createTransaction('payment', refersTo, amount, date, 'Pago del adeudo de ' + additionalDesc);
            let newBalance = previousBalance - amount;
            Student.findByIdAndUpdate(refersTo, {balance: newBalance}, (err, updatedStudent) => {
                if(err) throw err;
                console.log(updatedStudent);
                res.send({msg: 'success'});
            })
        })
    }
});

app.get("/admin/overdue_payments", function(req,res){
    let lateStudents = [];
    Students.find({},(err,allStudents) => {
        if(err) throw err;
        allStudents.forEach((student) => {
            let paymentCycle = student.paymentCycle;
            let paymentDeadline = student.lastPaymentMade;
            // in switch do something to paymentDeadline
            switch (paymentCycle) {
                case 'Weekly':
                    paymentDeadline.setDate(paymentDeadline.getDate()+7);
                    break;
                case 'Monthly':
                    paymentDeadline.setMonth(paymentDeadline.getMonth()+1);
                    break;
                case 'Quarterly':
                    paymentDeadline.setMonth(paymentDeadline.getMonth()+3);
                    break;
                default:
                    break;
            }
            Transaction.find({referenceTo: student._id}, (err, allTransactionsForStudent) => {
                console.log(student);
                let lastTransaction = allTransactionsForStudent[allTransactionsForStudent.length()-1];
                // if the last registered transaction for the student is a charge and this charge exceeds the deadline
                // the student is late with payment
                if(lastTransaction.kind === 'charge' && paymentDeadline <= lastTransaction.date ) {
                    lateStudents.push(student);
                }
                else if(student.balance > 0){
                    lateStudents.push(student);
                }
                else{
                    // if the student is late with payment a charge must be created
                    createTransaction('charge', student._id, student.paymentAmount, new Date(), "Retraso en el pago mensual de sus clases.");
                    // update the student's balance to reflect the new charge
                    let newBalance = student.balance + student.paymentAmount;
                    Student.findByIdAndUpdate(student._id, {balance: newBalance}, {new: true}, (err,updatedStudent) => {
                        lateStudents.push(updatedStudent);
                    })
                }
            });
        })
        res.send({msg: 'success', lateStudents: lateStudents})
    });
    
});

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