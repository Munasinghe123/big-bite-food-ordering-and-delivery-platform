const express = require('express');
const router = express.Router();

const { registerResturant,approveResturant,getPendingResturant,getRejectedResturant,updateResturantPaymentStatus } = require('../Controller/ResturantController')

const verifyToken = require('../Middleware/verifyToken');
const verifyRole = require('../Middleware/verifyRole');
const upload = require('../Middleware/multerConfig');

router.post("/registerResturant", upload, registerResturant);
router.put('/approveRestaurant',verifyToken,verifyRole("SystemAdmin"),approveResturant);
router.get('/getPendingRestaurants',verifyToken,verifyRole("SystemAdmin"),getPendingResturant);
router.get('/getRejectedResturant',verifyToken,verifyRole("SystemAdmin"),getRejectedResturant);
router.put('/updateResturantPaymentStatus/:id',updateResturantPaymentStatus);

module.exports = router;