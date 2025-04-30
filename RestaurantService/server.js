const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:30100',
    credentials: true,
};

// import routes
const menuRoutes = require('./Routes/menuRoutes'); 
const dashboardRoutes = require('./Routes/dashboardRoutes');
const reportRoutes = require('./Routes/reportRoutes');

app.use(cors(corsOptions));
app.use(express.json());    
app.use(cookieParser());

// api endpoints

app.use('/api/menu', menuRoutes);
//app.use('/images', express.static('uploads'));
app.use('/images', express.static(path.join(__dirname, 'uploads')));

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