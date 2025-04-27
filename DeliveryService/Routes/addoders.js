const express = require('express');
const router = express.Router();
const Addoder = require('../Models/Addoder');
const verifyToken = require('../Middleware/verifyToken');

// Add a new order
router.route('/addoder').post(verifyToken, async (req, res) => {
  try {
    const {
      customerName,
      pinNumber,
      restaurantAddress,
      customerAddress,
      customerMobile,
      odervalue,
      orderDetails,
      deliveryStatus,
      assignedTo
    } = req.body;

    // Handle assignedTo: convert "null" string or undefined to null
    let processedAssignedTo = assignedTo;
    if (assignedTo === 'null' || assignedTo === '' || assignedTo === undefined) {
      processedAssignedTo = null;
    } else if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: 'Invalid assignedTo ID format.' });
    }

    const newAddoder = new Addoder({
      customerName,
      pinNumber,
      restaurantAddress,
      customerAddress,
      customerMobile,
      odervalue,
      orderDetails,
      deliveryStatus: deliveryStatus || 'Pending', // Default if not provided
      assignedTo: processedAssignedTo // Use processed value
    });

    await newAddoder.save();
    res.json({ message: 'Order Added Successfully', order: newAddoder });
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).json({ error: 'Error adding order', details: err.message });
  }
});

// Show orders for the authenticated delivery person
router.get('/showoder', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role; // Assuming your token includes user role
    
    let query = {};
    
    if (userRole === 'DeliveryPerson') {
      // For delivery persons, show orders assigned to them
      query.assignedTo = userId;
    } else if (userRole === 'Customer') {
      // For customers, show their own orders
      query.customerMobile = req.user.phone; // Or customerEmail if you prefer
    } else {
      // Admin or other roles might see all orders
      query = {};
    }
    
    const orders = await Addoder.find(query);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Error fetching orders', details: err.message });
  }
});

// Update order delivery status
router.route('/updateOrder/:id').put(verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body;

    const updatedOrder = await Addoder.findByIdAndUpdate(id, { deliveryStatus }, { new: true });
    if (!updatedOrder) {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.json({ message: 'Order updated successfully', order: updatedOrder });
    }
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Error updating order status', details: err.message });
  }
});

module.exports = router;