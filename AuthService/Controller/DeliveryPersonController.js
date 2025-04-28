const userModel = require('../Models/UserModel');
const bcryptjs = require('bcryptjs');
const axios = require('axios');

const registerDeliveryPerson = async (req, res) => {
    try {

        const{ name, email, password, phone, vehicalNo,role } = req.body;
        const diliveryPhoto = req.files['diliveryPhoto'] ? req.files['diliveryPhoto'][0].filename : null;

        console.log("request body",req.body);

        if(!name || !email || !password || !phone || !role || !diliveryPhoto) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if(role !== "DeliveryPerson"){
            return res.status(400).json({message:"Invalid role"});
        }

        const exixtingUser = await userModel.findOne({name});
        if(exixtingUser){
            return res.status(400).json({message:"User already exists"});
        }

        const hashPassword = await bcryptjs.hash(password, 10);

        const newDeliveryPerson  = new userModel({
            name,
            email,
            password:hashPassword,
            phone,
            role,
            vehicalNo,
            photo:diliveryPhoto,
             paymentStatus: "Pending"
        });

        const savedDeliveryPerson = await newDeliveryPerson.save();

          // Format phone number
          let deliveryPersonPhone = savedDeliveryPerson.phone;
          if (deliveryPersonPhone.startsWith("0")) {
              deliveryPersonPhone = deliveryPersonPhone.replace(/^0/, "+94");
          }
  
          console.log("delivery person phone:", deliveryPersonPhone);
 
         await axios.post('http://admin-notification-service:7000/api/notifications/send-notifications', {
             email: {
                 to: savedDeliveryPerson.email,
                 subject: 'Your rergistration request has been recieved.',
                 text: `Dear ${savedDeliveryPerson.name},\n\nYour registration request have been recieved.We will
                  notify you in a while.\n\nThank you!`
             },
             sms: {
                 to:deliveryPersonPhone,
                 body: `Dear "${savedDeliveryPerson.name}", your resgistration request have been recieved.`
             }
         });

        res.status(201).json({message:"Delivery person registered successfully", newDeliveryPerson});

     }catch(err){
        console.error("Error in registerDeliveryPerson:", err);
        res.status(500).json({ message: "Internal server error" });
     }

}

const getPendingDeliveryPerson = async(req,res)=>{

    try{
        const pendingDeliveryPerson  = await userModel.find({status:"pending", role:"DeliveryPerson"});
        if(!pendingDeliveryPerson){
            return res.status(404).json({message:"No pending delivery person found"});
        }
        res.status(200).json({pendingDeliveryPerson});
    }catch(err){
        console.error("Error fetching pending delivery persons:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

const approveDeliveryPerson = async (req, res) => {
    try {
        const { deliveryPersonId, status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const updatedDeliveryPerson = await userModel.findByIdAndUpdate(
            deliveryPersonId,
            { status },
            { new: true }
        );

        if (!updatedDeliveryPerson) {
            return res.status(404).json({ message: "Delivery person not found" });
        }

        // Format phone number
        let deliveryPersonPhone = updatedDeliveryPerson.phone;
        if (deliveryPersonPhone.startsWith("0")) {
            deliveryPersonPhone = deliveryPersonPhone.replace(/^0/, "+94");
        }

        console.log("delivery person phone:", deliveryPersonPhone);

        axios.post('http://admin-notification-service:7000/api/notifications/send-notifications', {
            email: {
                to: updatedDeliveryPerson.email,
                subject: `Your registration has been ${status}`,
                text: `Dear ${updatedDeliveryPerson.name},\n\nYour registration has been ${status} by the system admin.\n\nThank you!`
            },
            sms: {
                to: deliveryPersonPhone,
                body: `Dear "${updatedDeliveryPerson.name}", your registration has been ${status}.`
            }
        }).then(() => {
            console.log("Notification sent");
        }).catch(err => {
            console.error(" Notification failed:", err.message);
        });

        console.log("Before sending final response");
        return res.status(200).json({
            message: `Delivery person ${status} successfully.`,
            updatedDeliveryPerson
        });

    } catch (err) {
        console.error("Approve Delivery Error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}
const updatePaymentStatus = async (req, res) => {
    try {
        const name = req.params.id;

        const deliveryPerson = await userModel.findOneAndUpdate(
            {name},
            { paymentStatus: "Paid" },
            { new: true }
        );

        if (!deliveryPerson) {
            return res.status(404).json({ message: "Delivery person not found" });
        }

        res.status(200).json({ message: "Payment status updated to Paid", deliveryPerson });

    } catch (err) {
        console.error("Error updating payment status:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getRejectedDelivery = async(req,res)=>{

    try{

        const rejected = await userModel.find({status:"rejected"});
        if(!rejected){
            res.status(400).json({message:"no rejected delivery persons",rejected});
        }

        res.status(200).json({message:"rejected delevery persons",rejected});
    }catch(err){
        console.error("Error updating payment status:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }

}




module.exports = {registerDeliveryPerson,getPendingDeliveryPerson,approveDeliveryPerson,updatePaymentStatus,getRejectedDelivery}