const mongoose = require('mongoose');

const orderCancellationSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  cancellationReason: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500,
  },
  additionalComments: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
  acknowledgment: {
    type: Boolean,
    required: true,
  },
  orderStatusAtCancellation: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'readyForPickup', 'driverAssigned', 'driverAccepted'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('OrderCancellation', orderCancellationSchema);