const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express();

const customerRoutes = require('./routes/customerRoutes');

dotenv.config();

const corsOptions = {
    origin: 'http://localhost:30100',
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/customer', customerRoutes);

//mongodb connection string
const connectionString = process.env.MONGO_URI;

mongoose.connect(connectionString)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.log(err)
        process.exit(1);
    })

const port = 5002;
app.listen(port, () => console.log("Customer service running on port 5002"));