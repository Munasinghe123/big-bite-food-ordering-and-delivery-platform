const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();


//sandunroutes
const addoderRouter = require("./Routes/addoders");
const driverRouter = require("./Routes/driverRoutes");


//commmon routes
//const userRoutes = require('./Routes/UserRoutes');

//systemAdmin routes
const userRelatedRoutes = require('./Routes/SystemAdmin/UserRelatedRoutes');



const app = express();

const corsOptions = {
    origin: 'http://localhost:30100',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
    res.send('Delivery and Notification API is running');
  });

// uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//commmon routes
//app.use('/api/users/', userRoutes);


//systemAdmin routes
app.use('/api/userRelated/', userRelatedRoutes);

//SandunRoutes
app.use("/Addoder", addoderRouter);
app.use('/driverRoutes', driverRouter);


//mongodb connection string
const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString)
    .then(() => console.log("database connected"))
    .catch((err) => {
        console.log(err)
        process.exit(1);
    })

const port = 7003;
app.listen(port, () => console.log("server running in port 7003"));