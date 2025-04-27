const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addoderSchema = new Schema({
    customerName: { type: String, required: true },
    pinNumber: { type: Number, required: true },
    restaurantAddress: { 
        latitude: { type: Number, required: true }, 
        longitude: { type: Number, required: true } 
    },
    customerAddress: { 
        latitude: { type: Number, required: true }, 
        longitude: { type: Number, required: true }
    },
    customerMobile: { type: Number, required: true },
    odervalue: { type: Number, required: true },
    orderDetails: { type: String, required: true },
    deliveryStatus: { 
        type: String, 
        enum: ["Pending", "Accepted", "In Transit", "Delivered"], 
        default: "Pending" 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'UserModel', 
        required: false 
    },
}, { timestamps: true });

const Addoder = mongoose.model('Addoder', addoderSchema);
module.exports = Addoder;
