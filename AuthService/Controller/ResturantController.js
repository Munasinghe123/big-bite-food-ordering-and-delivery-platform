const resturantModel = require('../Models/ResturantModel');
const UserModel = require('../Models/UserModel');
const bcryptjs = require('bcryptjs');
const axios = require('axios');

const registerResturant = async (req, res) => {
    try {
        const { name, location, restaurantPhone, lat, lng, adminPassword,adminEmail,fullName,adminName,role,phone } = req.body;
        const restaurantPhoto = req.files['resturantPhoto'] ? req.files['resturantPhoto'][0].filename : null;
        const adminPhoto = req.files['adminPhoto'] ? req.files['adminPhoto'][0].filename : null;

        console.log(req.body);
        console.log("all photos",req.files);

        const checkAdminName = await UserModel.findOne({name:adminName});
        if(checkAdminName){
            return res.status(400).json({message:"User name already exixts"});
        }

        if (!name || !location || !restaurantPhoto || !lat || !lng  || !restaurantPhone ||
            !adminPassword||!adminEmail||!adminName||!role||!adminPhoto || !phone) {
            console.log("Provide all the required fields");
            return res.status(404).json({ message: "Provide all the required fields" });
        }

        const existingName = await resturantModel.findOne({ restaurantName: name, restaurantLocation: location });
        if (existingName) {
            console.log("Resturant already exists!");
            return res.status(409).json({ message: "Resturant already exists!" });
        }

        //saving resturant admin
        const encryptedPassword = await bcryptjs.hash(adminPassword,10);

        const newResturantAdmin = new UserModel({
            name:adminName,
            email:adminEmail,
            fullName,
            password:encryptedPassword,
            role,
            phone,
            photo:adminPhoto,
            resturantName:name,
           
        })

        const savedResturantAdmin = await newResturantAdmin.save();

        //saving the resturant
        const newResturant = new resturantModel({
            restaurantName: name,
            restaurantLocation: location,
            restaurantPhoto,
            paymentStatus: "Pending",
            restaurantPhone,
            lat,
            lng,
            admin:savedResturantAdmin._id,
        });

        const registeredResturant = await newResturant.save();

    
        const restaurantName = registeredResturant.restaurantName;

        // Format phone
        let adminPhone = savedResturantAdmin.phone;
        if (adminPhone.startsWith("0")) {
            adminPhone = adminPhone.replace(/^0/, "+94");
        }

        console.log("delivery person phone:", adminPhone);

        await axios.post('http://admin-notification-service:7000/api/notifications/send-notifications', {
            email: {
                to: savedResturantAdmin.email,
                subject: 'Your rergistration request has been recieved.',
                text: `Dear ${savedResturantAdmin.name},\n\nYour ${restaurantName} registration request have been recieved.We will notify you in a while.\n\nThank you!`
            },
            sms: {
                to: adminPhone,
                body: `Dear "${savedResturantAdmin.name}", your registration request have been recieved.`
            }
        });

        res.status(200).json({ message: "Resturant registered successfully", registeredResturant,savedResturantAdmin });
    } catch (err) {
        res.status(500).json({ message: "Resturant registration error", error: err.message });
        console.log(err);
    }
};

const approveResturant = async (req, res) => {
    try {
        const { restaurantId, status } = req.body; 

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        console.log("resturant route hit");

        const updatedResturant = await resturantModel.findOneAndUpdate(
            {restaurantId},
            { status },
            { new: true }
        ).populate('admin');
      
        if (!updatedResturant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        console.log("resturant updated");

         // Format phone
        let adminPhone = updatedResturant.admin.phone;
        if (adminPhone.startsWith("0")) {
            adminPhone = adminPhone.replace(/^0/, "+94");
        }
        
        await axios.post('http://admin-notification-service:7000/api/notifications/send-notifications', {
            email: {
                to: updatedResturant.admin.email,
                subject: `Your registration has been ${status}`,
                text: `Dear ${updatedResturant.admin.name},\n\nYour ${updatedResturant.restaurantName} registration has been ${status} by the system admin.\n\nThank you!`
            },
            sms: {
                to: adminPhone,
                body: `Dear "${updatedResturant.admin.name}", your resturant have been ${status}.`
            }
        });

        console.log("resturant notification sent");
        
        res.status(200).json({
            message: `Restaurant ${status} successfully and email and sms sent`,
            updatedResturant
        });

    } catch (err) {
        res.status(500).json({ message: "Error updating restaurant status", error: err.message });
    }
};

const getPendingResturant = async(req,res)=>{
    try{
        const pendingRestaurants = await resturantModel.find({ status: "pending" }).populate('admin');

        console.log("pending resturants",pendingRestaurants);
        res.status(200).json({ pendingRestaurants });

    }catch(err){
        res.status(500).json({ message: "Error fetching pending restaurants", error: err.message });
    }

}

const getRejectedResturant = async(req,res)=>{

    try{
        const rejectedResturants = await resturantModel.find({status:"rejected"}).populate('admin');
        if(!rejectedResturants){
            return res.status(404).json({ message: "No rejected restaurants found" });
        }
        console.log("rejected resturants",rejectedResturants);

        res.status(200).json({message:"Rejected resturants",rejectedResturants});

    }catch(err){
        res.status(500).json({ message: "Error fetching rejected restaurants", error: err.message });   
    }
}

const updateResturantPaymentStatus = async (req, res) => {
    try {
        const restaurantName = req.params.id;

        const resturant = await resturantModel.findOneAndUpdate(
            {restaurantName},
            { paymentStatus: "Paid" },
            { new: true }
        );

        if (!resturant) {
            return res.status(404).json({ message: "Delivery person not found" });
        }

        res.status(200).json({ message: "Payment status updated to Paid", resturant });

    } catch (err) {
        console.error("Error updating payment status:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllRestaurants = async (req, res) => {
    try {
      const restaurants = await resturantModel.find({});
      res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching restaurants', error: error.message });
    }
  };
  
  const getRestaurantById = async (req, res) => {
    try {
    //   const restaurant = await resturantModel.findById(req.params.id);
    const restaurant = await resturantModel.findOne({ admin: req.params.id });
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  const updateRestaurant = async (req, res) => {
    const { restaurantName, restaurantLocation, lat, lng, openStatus } = req.body;
    try {
        //const restaurant = await resturantModel.findById(req.params.id);
        const restaurant = await resturantModel.findOne({ admin: req.params.id });
  
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
  
        restaurant.restaurantName = restaurantName || restaurant.restaurantName;
        restaurant.restaurantLocation = restaurantLocation || restaurant.restaurantLocation;
        restaurant.lat = lat || restaurant.lat;
        restaurant.lng = lng || restaurant.lng;
        restaurant.openStatus = openStatus || restaurant.openStatus;
  
        if (req.files && req.files['resturantPhoto']) {
            const oldImage = restaurant.restaurantPhoto;
            restaurant.restaurantPhoto = req.files['resturantPhoto'][0].filename; 
        
         
            fs.unlink(`uploads/${oldImage}`, (err) => {
                if (err) console.error('Error deleting the old photo:', err);
            });
        }
  
        await restaurant.save();
        res.status(200).json({ success: true, message: 'Restaurant updated successfully', data: restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating restaurant', error: error.message });
    }
};

  


module.exports = { registerResturant, approveResturant,getPendingResturant,getRejectedResturant,updateResturantPaymentStatus, getRestaurantById, getAllRestaurants, updateRestaurant };

