const express = require('express'),
    mongoose = require('mongoose'),
    app = express(),
    PORT = process.env.PORT || 5000

app.get("/", function(req,res){
    console.log("Welcome to index route");
    res.status(200).json({msg: 'Welcome to index route'})
});

app.listen(PORT, () => {
    console.log("App is working on PORT " + PORT);
});