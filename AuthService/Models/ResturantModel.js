const mongoose = require('mongoose')

const resturantSchema = mongoose.Schema({

    resturantName: {
        type: String,
        required: true
    },
    resturantLocation: {
        type: String,
        required: true
    },
    resturantPhoto: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid"],
        default: "Pending"
        
    }, lat: { type: String, required: true },  
    lng: { type: String, required: true },
    admin:{
        type:mongoose.Schema.ObjectId,
        ref:'UserModel',
        required:true
    },
    status:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending"
    }

})

module.exports = mongoose.model("Restaurant", resturantSchema)