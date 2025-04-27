const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: { 
        type: String,
        required: true,
        unique: true
    },
    fullName: { 
        type: String 
    },
    email: { 
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["SystemAdmin", "Admin", "ResturantAdmin", "DeliveryPerson", "Customer"],
        default: "Customer"
    },
    photo: { 
        type: String 
    },
    phone: { 
        type: String 
    },

    // Only for ResturantAdmin and DeliveryPerson
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid"],
        default: "Pending"
    },

    // Only for ResturantAdmin
    resturantName: {
        type: String,
    },

    // Only for DeliveryPerson
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    vehicalNo: {
        type: String,
    }
});

UserSchema.pre('save', function (next) {
    if (this.role !== "ResturantAdmin" && this.resturantName) {
        this.resturantName = undefined;
    }

    if (this.role !== "ResturantAdmin" && this.role !== "DeliveryPerson" && this.paymentStatus) {
        this.paymentStatus = undefined;
    }

    if (this.role !== "DeliveryPerson" && (this.status || this.vehicalNo)) {
        this.status = undefined;
        this.vehicalNo = undefined;
    }
    next();
});

module.exports = mongoose.model("UserModel", UserSchema);
