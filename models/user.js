const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        default: 0
    },
    is_varified: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: ''
    },
    blocked:{
        type: Boolean,
        default: false
    },
    address: [
        {
            country:{
                type: String
            },
            billingAddressName:{
                type: String 
            },
            address:{
                type: String
            },
            townCity:{
                type: String
            },
            zipPostalCode:{
                type: String
            },
            email:{
                type: String
            },
            number:{
                type: Number
            },
        },
    ],
});

module.exports = mongoose.model('User', userSchema);

