const { 
    register, viewCustomer, updateCustomer, updateCustomerLocation, deleteCustomer, viewAllCustomers
} = require('../controllers/customerController');

const express = require('express');
const router = express.Router();

const verifyToken = require('../Middleware/verifyToken');
const verifyRole = require('../Middleware/verifyRole');

router.post('/register', register);


router.get('/view/:id',  viewCustomer);

router.put('/update/:id', verifyToken, verifyRole("Customer"), updateCustomer);

router.put('/update-location/:id', verifyToken, verifyRole("Customer"), updateCustomerLocation);

router.delete('/delete/:id', verifyToken, verifyRole("Customer", "SystemAdmin"), deleteCustomer);

router.get('/view-all', verifyToken, verifyRole("Customer", "DeliveryPerson", "SystemAdmin"), viewAllCustomers );


module.exports = router;