const { 
    createOrder, viewOrder, viewCustomerOrderHistory, viewPendingOrderByCustomer, updateOrder, updateOrderPaymentStatus, updateOrderStatus, 
    updateOrderDeliveryPerson, deleteOrder, viewAllOrders, updateOrderPaymentStatusAfterSuccess, updateStatus 
} = require('../controllers/orderController');

const express = require('express');
const router = express.Router();
const verifyToken = require('../Middleware/verifyToken');
const verifyRole = require('../Middleware/verifyRole');


router.post('/create-order', createOrder);

router.get('/view/:id', viewOrder);
router.get('/view-history/:id', viewCustomerOrderHistory);

router.get('/view-pending/:id', verifyToken, verifyRole("Customer", "DeliveryPerson"), viewPendingOrderByCustomer);

// update details
router.put('/update/:id', verifyToken, verifyRole("Customer", "DeliveryPerson"), updateOrder);
router.put('/update-payment-status/:id', updateOrderPaymentStatus);
router.put('/update-order-status/:id', updateOrderStatus);
router.put('/mark-paid/:id', updateOrderPaymentStatusAfterSuccess);

router.put('/update-delivery-person/:id', updateOrderDeliveryPerson);

router.delete('/delete/:id', verifyToken, verifyRole("Customer", "DeliveryPerson"), deleteOrder);

// manage all orders - admin
router.get('/view-all-orders', viewAllOrders);

// restaurant admin
router.put("/:orderId/status", updateStatus);

module.exports = router;