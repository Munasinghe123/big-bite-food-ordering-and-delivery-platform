const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};

// import routes
//const userRoutes = require('./Routes/userRoutes');
const menuRoutes = require('./Routes/menuRoutes');
//const orderRoutes = require('./Routes/orderRoutes');
const restaurantRoutes = require('./Routes/restaurantRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const reportRoutes = require('./Routes/reportRoutes');

app.use(cors(corsOptions));
app.use(express.json());    
app.use(cookieParser());

// api endpoints
//app.use('/api/users', userRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/images', express.static('uploads'));
//app.use('/api/order', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/report', reportRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const CONNECTION_STRING=process.env.CONNECTION_STRING;

mongoose.connect(CONNECTION_STRING)
    .then(()=>console.log("DB connected"))
    .catch((err)=>{
        console.log(err)
        process.exit(1);
    })

const port = 5004;
app.listen(port,()=>console.log(`App running in port ${port}`))