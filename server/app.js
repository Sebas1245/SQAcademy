const student = require('./models/student');

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
// Register student post route
app.post("/admin/register_student", isLoggedIn, function(req,res,next) {
    let { 
        name, 
        email, 
        phone, 
        classGroup, 
        paymentAmount, 
        paymentCycle, 
        classStart, 
        firstPaymentDate, 
        additionalAmount, 
        additionalAmountDescription, 
        additionalAmountDeadline } = req.body;
    if(firstPaymentDate === null) {
        firstPaymentDate = [];
    }
    if(additionalAmountDeadline === null) {
        additionalAmountDeadline = undefined;
    }
    if(additionalAmount === 0) {
        console.log(additionalAmount);
    }
    if(additionalAmountDescription === '') {
        additionalAmountDescription = undefined;
    }
    const newStudent = new Student({
        name: name,
        email: email,
        phone: phone,
        classGroup: classGroup,
        paymentAmount: paymentAmount,
        paymentCycle: paymentCycle,
        classStart: classStart,
        additionalAmount: additionalAmount,
        additionalAmountDescription: additionalAmountDescription,
        additionalAmountDeadline: additionalAmountDeadline,
        paymentHistory: firstPaymentDate
    });

    newStudent.save((err, createdStudent) => {
        if(err) throw err;
        res.send({msg: 'success', createdStudent: createdStudent});
        console.log(createdStudent);
    });

});

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