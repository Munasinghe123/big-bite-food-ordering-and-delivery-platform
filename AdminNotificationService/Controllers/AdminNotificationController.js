
const {sendEmail} = require('../utils/Emailservice');
const {sendSms} = require('../utils/SmsService');

const sendNotifications = async(req,res)=>{

    try{

        const{email,sms} = req.body;

        console.log("sms body", sms);

        if(email){
            await sendEmail(email.to, email.subject, email.text);
        }
        if(sms){
            await sendSms(sms.to, sms.body);
        }
        return res.status(200).json({ message: "from notification service - Notifications sent successfully" });

    }catch(err){
        console.error("Error in sendNotifications:", err.message);
        return res.status(500).json({message: "Internal Server Error"});
    }

}

module.exports = {sendNotifications};