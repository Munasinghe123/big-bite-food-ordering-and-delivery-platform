/*const mongoose = require('mongoose')

const UserModel = mongoose.Schema({

    name: { type: String },
    email: { type: String },
    password: { type: String },
    role: {
        type: String,
        enum: ["SystemAdmin", "ResturantAdmin", "DeliveryPerson", "Customer"],
        default: "Customer"
    },
    photo: {
        type: String
    }
})

module.exports = mongoose.model("UserModel", UserModel);*/