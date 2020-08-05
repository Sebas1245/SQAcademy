const mongooose = require('mongoose');

let userSchema = new mongooose.Schema({
    username: String,
    password: String,
    role: String
});

module.exports = mongooose.model("User", userSchema);