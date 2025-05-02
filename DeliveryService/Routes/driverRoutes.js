const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Driver = require('../Models/DriverModel');
const calculateDistance = require('../Middleware/calculateDistance');
const OrderCancellation = require('../Models/OrderCancellationModel'); // Added import
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/notifications');

// Custom verifyToken middleware to validate JWT from auth service
const verifyToken = (req, res, next) => {
  let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};


// Helper function to fetch a single user's data from auth service
async function fetchUserFromAuth(userId, token) {
  try {
    const response = await axios.get('http://localhost:7001/api/delivery/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = response.data.pendingDeliveryPerson || [];
    const authUser = users.find((user) => user._id === userId);

    if (!authUser) {
      throw new Error(`User ${userId} not found in auth service`);
    }

    return {
      id: authUser._id,
      name: authUser.name || 'Unknown',
      email: authUser.email || '',
      phone: authUser.phone || '',
      role: authUser.role || 'DeliveryPerson',
      status: authUser.status || 'pending',
    };
  } catch (err) {
    console.error(`Error fetching user ${userId} from auth service:`, err.message);
    throw err;
  }
}

// Update driver's location
router.put('/update-location', verifyToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.id;
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Invalid latitude or longitude values.' });
  }

  try {
    if (req.user.role !== 'DeliveryPerson') {
      return res.status(403).json({ message: 'Only DeliveryPerson users can update driver location.' });
    }

    let userData;
    try {
      userData = await fetchUserFromAuth(userId, token);
    } catch (err) {
      console.warn(`Failed to fetch user details: ${err.message}`);
      // Fallback to using the data from the token
      userData = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '', // Use empty string if not available
        role: req.user.role
      };
    }

    let driver = await Driver.findOne({ userId });
    if (!driver) {
      driver = new Driver({
        userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone, // Will be empty string if not available
        role: userData.role,
        currentLocation: { latitude, longitude },
        isAvailable: true,
      });
    } else {
      driver.currentLocation.latitude = latitude;
      driver.currentLocation.longitude = longitude;
      // Only update fields if we have new data
      driver.name = userData.name || driver.name;
      driver.email = userData.email || driver.email;
      driver.phone = userData.phone || driver.phone;
      driver.role = userData.role;
    }

    await driver.save();

    res.status(200).json({ 
      success: true,
      message: 'Driver location updated successfully.',
      driver 
    });
  } catch (err) {
    console.error('Error updating driver location:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating driver location',
      details: err.message
    });
  }
});

// New endpoint for payment-success driver assignment (no auth required)
router.post('/assign-driver-payment-success', async (req, res) => {
  try {
    const { orderId, secretKey } = req.body;
    
    // Simple security check (replace with more robust solution in production)
    if (secretKey !== process.env.PAYMENT_SUCCESS_SECRET) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required in the request body',
      });
    }

    console.log(`Processing payment-success driver assignment for order: ${orderId}`);

    // Fetch the specific order from order-service
    let order;
    try {
      const response = await axios.get(`http://order-service:5000/orders/view/${orderId}`);
      order = response.data;
      
      if (!order || order.orderStatus !== 'pending' || order.paymentStatus !== 'Paid' || order.deliveryPersonId) {
        return res.status(400).json({
          success: false,
          message: 'Order not eligible for driver assignment',
          details: {
            exists: !!order,
            status: order?.orderStatus,
            paymentStatus: order?.paymentStatus,
            hasDriver: !!order?.deliveryPersonId
          }
        });
      }
    } catch (apiErr) {
      console.error('Error fetching order from order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order from order-service',
        details: apiErr.message,
      });
    }

    // Find available drivers with valid locations
    const drivers = await Driver.find({
      isAvailable: true,
      role: 'DeliveryPerson',
      'currentLocation.latitude': { $exists: true, $ne: null },
      'currentLocation.longitude': { $exists: true, $ne: null },
    });

    if (!drivers.length) {
      return res.status(404).json({
        success: false,
        message: 'No available drivers found',
      });
    }

    // Calculate distances and find nearest driver
    const restaurantLocation = {
      latitude: parseFloat(order.restaurantLocationLatitude),
      longitude: parseFloat(order.restaurantLocationLongitude)
    };

    let nearestDriver = null;
    let minDistance = Infinity;

    for (const driver of drivers) {
      const driverLocation = {
        latitude: driver.currentLocation.latitude,
        longitude: driver.currentLocation.longitude
      };

      const distance = calculateDistance(driverLocation, restaurantLocation);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = driver;
      }
    }

    if (!nearestDriver) {
      return res.status(404).json({
        success: false,
        message: 'No suitable driver found',
      });
    }

    // Update order with driver assignment
    try {
      await axios.put(`http://order-service:5000/orders/update-delivery-person/${orderId}`, {
        deliveryPersonId: nearestDriver.userId,
        deliveryPersonName: nearestDriver.name,
        deliveryPersonPhone: nearestDriver.phone,
      });

      await axios.put(`http://order-service:5000/orders/update-order-status/${orderId}`, {
        orderStatus: 'driverAssigned',
      });

      // Update driver status
      await Driver.findByIdAndUpdate(nearestDriver._id, {
        $set: { isAvailable: false },
        $inc: { currentOrders: 1 },
      });

      // Send notification to driver
      if (nearestDriver.email) {
        const emailSubject = `New Order Assigned - Order ID: ${orderId}`;
        const emailBody = `Hello ${nearestDriver.name},\n\nYou have been assigned to deliver order ${orderId}.\n\nRestaurant: ${order.restaurantName}\n\nPlease proceed to pick up the order.\n\nBest regards,\nYour Delivery App Team`;
        
        try {
          await sendEmail(nearestDriver.email, emailSubject, emailBody);
        } catch (emailErr) {
          console.error('Failed to send email notification:', emailErr.message);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Driver assigned successfully',
        data: {
          orderId,
          driverId: nearestDriver.userId,
          driverName: nearestDriver.name,
          distance: `${minDistance.toFixed(2)} km`
        }
      });

    } catch (updateErr) {
      console.error('Failed to update order with driver assignment:', updateErr.message);
      res.status(500).json({
        success: false,
        error: 'Failed to complete driver assignment',
        details: updateErr.message,
      });
    }

  } catch (err) {
    console.error('Error in payment-success driver assignment:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message,
    });
  }
});

// Automatically assign an order to the nearest available driver
// Automatically assign an order to the nearest available driver
// Automatically assign an order to the nearest available driver
router.post('/assign-driver-auto', verifyToken, async (req, res) => {
  try {
    // Fetch pending orders from order-service
    let pendingOrders;
    try {
      const response = await axios.get('http://order-service:5000/orders/view-all-orders');
      pendingOrders = response.data.filter(
        (order) =>
          order.orderStatus === 'pending' &&
          order.paymentStatus === 'Paid' &&
          (!order.deliveryPersonId || order.deliveryPersonId === '')
      );
      console.log(`Found ${pendingOrders.length} eligible orders for assignment:`, pendingOrders.map(o => o.orderId));
    } catch (apiErr) {
      console.error('Error fetching orders from order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders from order-service',
        details: apiErr.message,
      });
    }

    if (!pendingOrders.length) {
      return res.status(404).json({
        success: false,
        message: 'No valid pending orders with paid status available for delivery',
      });
    }

    // Find available drivers with valid locations and complete data
    const drivers = await Driver.find({
      isAvailable: true,
      role: 'DeliveryPerson',
      name: { $exists: true, $ne: '' },
      email: { $exists: true, $ne: '' },
      phone: { $exists: true },
      'currentLocation.latitude': { $exists: true, $ne: null },
      'currentLocation.longitude': { $exists: true, $ne: null },
    });

    if (!drivers.length) {
      return res.status(404).json({
        success: false,
        message: 'No available drivers with valid locations and complete user data',
      });
    }

    const results = [];
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    // Process each order
    for (const order of pendingOrders) {
      try {
        const restaurantLat = parseFloat(order.restaurantLocationLatitude);
        const restaurantLon = parseFloat(order.restaurantLocationLongitude);

        if (isNaN(restaurantLat) || isNaN(restaurantLon)) {
          throw new Error(`Invalid coordinates for order ${order.orderId}`);
        }

        const restaurantLocation = {
          latitude: restaurantLat,
          longitude: restaurantLon,
        };

        // Find nearest driver
        let nearestDriver = null;
        let minDistance = Infinity;
        let driverUser = null;

        for (const driver of drivers) {
          if (!driver.role || driver.role !== 'DeliveryPerson') {
            console.warn(`Skipping driver ${driver.userId}: Invalid role (${driver.role})`);
            continue;
          }

          if (!driver.name || !driver.email) {
            console.warn(`Skipping driver ${driver.userId}: Missing name or email`);
            continue;
          }

          const driverLocation = {
            latitude: driver.currentLocation.latitude,
            longitude: driver.currentLocation.longitude,
          };

          const distanceToRestaurant = calculateDistance(driverLocation, restaurantLocation);

          if (distanceToRestaurant < minDistance) {
            minDistance = distanceToRestaurant;
            nearestDriver = driver;
            driverUser = {
              id: driver.userId,
              name: driver.name,
              email: driver.email,
              phone: driver.phone || '',
              role: driver.role,
            };
          }
        }

        if (!nearestDriver || !driverUser) {
          results.push({
            orderId: order.orderId,
            status: 'failed',
            reason: 'No suitable driver found',
          });
          continue;
        }

        // Update order with driver assignment via order-service API
        try {
          await axios.put(`http://order-service:5000/orders/update-delivery-person/${order.orderId}`, {
            deliveryPersonId: driverUser.id,
            deliveryPersonName: driverUser.name,
            deliveryPersonPhone: driverUser.phone,
          });

          await axios.put(`http://order-service:5000/orders/update-order-status/${order.orderId}`, {
            orderStatus: 'driverAssigned',
          });
        } catch (updateErr) {
          console.error(`Failed to update order ${order.orderId}:`, updateErr.message);
          results.push({
            orderId: order.orderId,
            status: 'failed',
            reason: 'Failed to update order with driver assignment',
          });
          continue;
        }

        // Update driver status
        await Driver.findByIdAndUpdate(nearestDriver._id, {
          $set: { isAvailable: false },
          $inc: { currentOrders: 1 },
        });

        // Send email notification to the driver
        if (driverUser.email) {
          const emailSubject = `New Order Assigned - Order ID: ${order.orderId}`;
          const emailBody = `Hello ${driverUser.name},\n\nYou have been assigned to an order.\n\nOrder ID: ${order.orderId}\n\nPlease proceed to pick up the order.\n\nBest regards,\nYour Delivery App Team`;
          try {
            await sendEmail(driverUser.email, emailSubject, emailBody);
          } catch (emailErr) {
            console.warn(`Failed to send email to ${driverUser.email}: ${emailErr.message}`);
          }
        }

        results.push({
          orderId: order.orderId,
          driverId: nearestDriver._id.toString(),
          driverUserId: driverUser.id,
          driverName: driverUser.name,
          distanceToRestaurant: `${minDistance.toFixed(2)} km`,
          status: 'assigned',
        });
      } catch (orderErr) {
        console.error(`Failed to process order ${order.orderId}:`, orderErr.message);
        results.push({
          orderId: order.orderId,
          status: 'failed',
          reason: orderErr.message,
        });
      }
    }

    if (results.every((r) => r.status === 'failed')) {
      return res.status(400).json({
        success: false,
        message: 'Failed to assign any orders',
        results,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver assignment completed',
      results,
    });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({
      success: false,
      error: 'Assignment failed',
      details: err.message,
    });
  }
});
// Fetch assigned orders for the authenticated user
router.get('/showtheorder', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let orders;
    try {
      const response = await axios.get('http://order-service:5000/orders/view-all-orders');
      orders = response.data;
    } catch (apiErr) {
      console.error('Error fetching orders from order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders from order-service',
        details: apiErr.message,
      });
    }

    let filteredOrders = [];
    if (userRole === 'DeliveryPerson') {
      filteredOrders = orders.filter(
        (order) =>
          (order.deliveryPersonId === userId || order.deliveryPersonId === userId.toString()) &&
          ['driverAssigned', 'driverAccepted', 'outForDelivery', 'delivered'].includes(
            order.orderStatus
          )
      );
    } else if (userRole === 'Customer') {
      filteredOrders = orders.filter((order) => order.customerId === userId.toString());
    } else if (userRole === 'ResturantAdmin') {
      filteredOrders = orders.filter((order) => order.restaurantId === userId.toString());
    } else {
      filteredOrders = orders;
    }

    const formattedOrders = filteredOrders.map((order) => ({
      orderId: order.orderId,
      status: order.orderStatus,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
      },
      restaurant: {
        name: order.restaurantName,
        location: {
          latitude: order.restaurantLocationLatitude,
          longitude: order.restaurantLocationLongitude,
        },
      },
      deliveryLocation: {
        latitude: order.deliveryLocationLatitude,
        longitude: order.deliveryLocationLongitude,
      },
      items: order.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: order.totalAmount,
      orderDate: order.orderDate,
      deliveryPerson: order.deliveryPersonName
        ? {
            name: order.deliveryPersonName,
            phone: order.deliveryPersonPhone,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      message: `Found ${filteredOrders.length} orders`,
      data: formattedOrders,
    });
  } catch (err) {
    console.error('Error in /showtheorder:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: err.message,
    });
  }
});

// Update order status
router.put('/updateOrder/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'readyForPickup',
      'driverAssigned',
      'driverAccepted',
      'outForDelivery',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    let updatedOrder;
    try {
      const response = await axios.put(`http://order-service:5000/orders/update-order-status/${id}`, {
        orderStatus,
      });
      updatedOrder = response.data.updatedOrder;
    } catch (apiErr) {
      console.error('Error updating order status via order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order status via order-service',
        details: apiErr.message,
      });
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Error updating order status', details: err.message });
  }
});

// Sync DeliveryPerson users to Driver collection
router.post('/sync-drivers', verifyToken, async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    const drivers = await Driver.find();
    for (const driver of drivers) {
      try {
        const user = await fetchUserFromAuth(driver.userId, token);
        if (user.status !== 'approved' || user.role !== 'DeliveryPerson') {
          console.log(
            `Removing driver ${driver._id}: Invalid status (${user.status}) or role (${user.role})`
          );
          await Driver.deleteOne({ _id: driver._id });
        } else {
          driver.name = user.name;
          driver.email = user.email;
          driver.phone = user.phone;
          driver.role = user.role;
          await driver.save();
        }
      } catch (userErr) {
        console.log(`Removing invalid driver ${driver._id}: ${userErr.message}`);
        await Driver.deleteOne({ _id: driver._id });
      }
    }

    let deliveryPersons;
    try {
      const response = await axios.get('http://localhost:7001/api/delivery/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      deliveryPersons = response.data.pendingDeliveryPerson || [];
    } catch (apiErr) {
      console.error('Error fetching delivery persons from auth service:', apiErr.message);
      return res.status(500).json({
        error: 'Failed to fetch delivery persons from auth service',
        details: apiErr.message,
      });
    }

    if (!deliveryPersons.length) {
      console.warn('No DeliveryPerson users found in auth service; checking local database');
      return res.status(404).json({
        message: 'No DeliveryPerson users found in auth service. Ensure users are registered and approved.',
      });
    }

    let syncedCount = 0;
    for (const user of deliveryPersons) {
      if (user.status !== 'approved' || user.role !== 'DeliveryPerson') {
        console.log(`Skipping user ${user._id}: status=${user.status}, role=${user.role}`);
        continue;
      }

      const existingDriver = await Driver.findOne({ userId: user._id });
      if (!existingDriver) {
        const newDriver = new Driver({
          userId: user._id,
          name: user.name || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'DeliveryPerson',
          currentLocation: { latitude: null, longitude: null },
          isAvailable: true,
        });
        await newDriver.save();
        console.log(`Added new driver for user ${user._id}`);
        syncedCount++;
      } else {
        existingDriver.name = user.name || existingDriver.name;
        existingDriver.email = user.email || existingDriver.email;
        existingDriver.phone = user.phone || existingDriver.phone;
        existingDriver.role = user.role || existingDriver.role;
        await existingDriver.save();
        console.log(`Updated driver for user ${user._id}`);
        syncedCount++;
      }
    }

    res.status(200).json({
      message: `Drivers synced successfully. Synced ${syncedCount} drivers.`,
    });
  } catch (err) {
    console.error('Error syncing drivers:', err.message);
    res.status(500).json({ error: 'Error syncing drivers', details: err.message });
  }
});

// Get completed orders for a specific driver
router.get('/completed-orders/:driverId', verifyToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    let orders;
    try {
      const response = await axios.get('http://order-service:5000/orders/view-all-orders');
      orders = response.data;
    } catch (apiErr) {
      console.error('Error fetching orders from order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders from order-service',
        details: apiErr.message,
      });
    }

    const completedOrders = orders
      .filter(
        (order) =>
          (order.deliveryPersonId === driverId ||
            order.deliveryPersonId === driverId.toString()) &&
          order.orderStatus === 'delivered'
      )
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (!completedOrders.length) {
      return res.status(200).json({
        success: true,
        message: 'No completed orders found',
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Completed orders retrieved successfully',
      data: completedOrders,
    });
  } catch (err) {
    console.error('Error in /completed-orders:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching completed orders',
      error: err.message,
    });
  }
});

// Record completed delivery
router.post('/record-delivery', verifyToken, async (req, res) => {
  try {
    const { orderId, deliveryPersonId } = req.body;

    if (!orderId || !deliveryPersonId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId and deliveryPersonId',
      });
    }

    let updatedOrder;
    try {
      const response = await axios.put(`http://order-service:5000/orders/update-order-status/${orderId}`, {
        orderStatus: 'delivered',
      });
      updatedOrder = response.data.updatedOrder;

      await axios.put(`http://order-service:5000/orders/update/${orderId}`, {
        deliveryPersonId,
        deliveredTime: new Date(),
      });
    } catch (apiErr) {
      console.error('Error updating order via order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order via order-service',
        details: apiErr.message,
      });
    }

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await Driver.findOneAndUpdate(
      { userId: deliveryPersonId },
      {
        $set: { isAvailable: true },
        $inc: { currentOrders: -1 },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Delivery recorded successfully',
      data: updatedOrder,
    });
  } catch (err) {
    console.error('Error in /record-delivery:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while recording delivery',
      error: err.message,
    });
  }
});

// Get all orders for the authenticated customer with delivery status
router.get('/customer-orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'Customer') {
      return res.status(400).json({
        success: false,
        message: 'Only customers can view their orders',
      });
    }

    let orders;
    try {
      const response = await axios.get(`http://order-service:5000/orders/view-history/${userId}`);
      orders = response.data;
    } catch (apiErr) {
      console.error('Error fetching customer orders from order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customer orders from order-service',
        details: apiErr.message,
      });
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No orders found for this customer',
        data: [],
      });
    }

    const formattedOrders = orders.map((order) => ({
      orderId: order.orderId,
      deliveryStatus: order.orderStatus,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
      },
      restaurant: {
        name: order.restaurantName,
        phone: order.restaurantPhone,
        location: {
          latitude: order.restaurantLocationLatitude,
          longitude: order.restaurantLocationLongitude,
        },
      },
      deliveryLocation: {
        latitude: order.deliveryLocationLatitude,
        longitude: order.deliveryLocationLongitude,
      },
      items: order.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderDate: order.orderDate,
      deliveredTime: order.deliveredTime || null,
      deliveryPerson: order.deliveryPersonName
        ? {
            name: order.deliveryPersonName,
            phone: order.deliveryPersonPhone,
          }
        : null,
      notes: order.notes || '',
    }));

    res.status(200).json({
      success: true,
      message: `Found ${orders.length} orders`,
      data: formattedOrders,
    });
  } catch (err) {
    console.error('Error in /customer-orders:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer orders',
      error: err.message,
    });
  }
});

// Send email notification
router.post('/sendEmail', verifyToken, async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, or text',
      });
    }

    await sendEmail(to, subject, text);

    res.status(200).json({
      success: true,
      message: `Email sending initiated for ${to}`,
    });
  } catch (err) {
    console.error(`Error initiating email to ${req.body.to}:`, err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate email sending',
      error: err.message,
    });
  }
});

// Cancel an order
router.post('/cancel-order/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const orderId = req.params.id; // Get order ID from URL parameter

    if (userRole !== 'Customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can cancel orders',
      });
    }

    const {
      cancellationReason,
      additionalComments,
      acknowledgment,
    } = req.body;

    // Validate required fields
    if (!orderId || !cancellationReason || acknowledgment === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, cancellationReason, or acknowledgment',
      });
    }

    if (typeof acknowledgment !== 'boolean' || !acknowledgment) {
      return res.status(400).json({
        success: false,
        message: 'Acknowledgment is required to cancel the order',
      });
    }

    // Fetch order details from order-service
    let order;
    try {
      // Try fetching specific order first (if endpoint exists)
      try {
        const response = await axios.get(`http://order-service:5000/orders/${orderId}`);
        order = response.data;
      } catch (specificErr) {
        console.warn(`Specific order fetch failed for ${orderId}, falling back to view-all-orders: ${specificErr.message}`);
        const response = await axios.get(`http://order-service:5000/orders/view-all-orders`);
        order = response.data.find(o => o.orderId === orderId);
      }
    } catch (apiErr) {
      console.error('Error fetching order from order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order from order-service',
        details: apiErr.message,
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`,
      });
    }

    // Handle missing customerId
    if (!order.customerId) {
      console.warn(`Order ${orderId} is missing customerId:`, order);
      console.log('JWT user data:', req.user);
      // Fallback: Use the authenticated user's ID as customerId
      order.customerId = userId;
      console.log(`Assigned fallback customerId (${userId}) to order ${orderId}`);

      // Update the order in the order-service to persist customerId
      try {
        await axios.put(`http://order-service:5000/orders/update/${orderId}`, {
          customerId: userId,
        });
        console.log(`Updated order ${orderId} with customerId ${userId} in order-service`);
      } catch (updateErr) {
        console.warn(`Failed to update order ${orderId} with customerId: ${updateErr.message}`);
        // Proceed with cancellation but log the failure
      }
    }

    // Verify the order belongs to the customer
    console.log('User ID from token:', userId);
    console.log('Order customerId:', order.customerId);
    if (order.customerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to cancel this order (customerId: ${order.customerId}, userId: ${userId})`,
      });
    }

    // Check if order is in a cancellable state
    const cancellableStatuses = ['pending', 'confirmed', 'preparing', 'readyForPickup', 'driverAssigned', 'driverAccepted'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be canceled in ${order.orderStatus} status`,
      });
    }

    // Save cancellation record
    const cancellation = new OrderCancellation({
      orderId,
      userId,
      cancellationReason,
      additionalComments: additionalComments || '',
      acknowledgment,
      orderStatusAtCancellation: order.orderStatus,
    });
    await cancellation.save();

    // Update order status to 'cancelled'
    let updatedOrder;
    try {
      const response = await axios.put(`http://order-service:5000/orders/update-order-status/${orderId}`, {
        orderStatus: 'cancelled',
      });
      updatedOrder = response.data.updatedOrder;
    } catch (apiErr) {
      console.error('Error updating order status via order-service:', apiErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order status via order-service',
        details: apiErr.message,
      });
    }

    // Handle driver if assigned
    if (order.deliveryPersonId && ['driverAssigned', 'driverAccepted'].includes(order.orderStatus)) {
      try {
        const driver = await Driver.findOne({ userId: order.deliveryPersonId });
        if (driver) {
          // Update driver availability
          await Driver.findOneAndUpdate(
            { userId: order.deliveryPersonId },
            {
              $set: { isAvailable: true },
              $inc: { currentOrders: -1 },
            }
          );

          // Notify driver via email only using AdminNotificationService
          const emailSubject = `Order Cancelled - Order ID: ${orderId}`;
          const emailBody = `Hello ${order.deliveryPersonName},\n\nThe order with ID ${orderId} has been cancelled by the customer.\n\nReason: ${cancellationReason}\n\n${
            additionalComments ? `Additional Comments: ${additionalComments}\n\n` : ''
          }Please dispose of any picked-up items as you see fit or return to the restaurant if applicable.\n\nBest regards,\nYour Delivery App Team`;

          try {
            await axios.post('http://admin-notification-service:7000/api/notifications/send-notifications', {
              email: {
                to: driver.email,
                subject: emailSubject,
                text: emailBody,
              }
            });
            console.log(`Email notification sent for order ${orderId} to ${driver.email}`);
          } catch (notificationErr) {
            console.warn(`Failed to send email notification for order ${orderId} to ${driver.email}: ${notificationErr.message}`);
          }
        }
      } catch (driverErr) {
        console.warn(`Error updating driver ${order.deliveryPersonId}: ${driverErr.message}`);
      }
    }

    // Format order details for response
    const orderDetails = {
      orderNumber: order.orderId,
      orderDateTime: order.orderDate,
      restaurant: order.restaurantName,
      deliveryAddress: `${order.deliveryLocationLatitude}, ${order.deliveryLocationLongitude}`,
      assignedDeliveryPerson: order.deliveryPersonName
        ? `${order.deliveryPersonName} (ID: ${order.deliveryPersonId})`
        : 'Not assigned',
      orderStatus: order.orderStatus,
    };

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderDetails,
        cancellation: {
          reason: cancellationReason,
          additionalComments,
          acknowledgment,
        },
      },
    });
  } catch (err) {
    console.error('Error in /cancel-order:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order',
      error: err.message,
    });
  }
});

module.exports = router;