const express = require('express');
const router = express.Router();
const { getDashboardStats, getPopularMenuItems, getOrderTrends } = require('../Controllers/dashboardController');
//const verifyToken = require('../../AuthService/Middleware/verifyToken');
//const verifyRole = require('../../AuthService/Middleware/verifyRole');

// router.get('/stats', verifyToken, verifyRole("ResturantAdmin"), getDashboardStats);
// router.get('/popular-menu-items', verifyToken, verifyRole("ResturantAdmin"), getPopularMenuItems);
// router.get('/order-trends', verifyToken, verifyRole("ResturantAdmin"), getOrderTrends);

router.get('/stats', getDashboardStats);
router.get('/popular-menu-items', getPopularMenuItems);
router.get('/order-trends', getOrderTrends);

module.exports = router;
