const nodemailer = require('nodemailer');

// Hardcode Gmail credentials
const EMAIL = 'morgennick65@gmail.com';
const PASSWORD = 'agjiihytshspdvcx';

// Setup transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL, // Hardcoded email address
        pass: PASSWORD // Hardcoded app-specific password
    }
});

// Function to send email notifications
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: EMAIL,
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports = { sendEmail };