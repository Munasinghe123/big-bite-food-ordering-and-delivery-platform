const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    default: 'Unknown',
  },
  email: {
    type: String,
    required: true,
    default: '',
  },
  phone: {
    type: String,
    required: false,
    default: '',
  },
  role: {
    type: String,
    required: true,
    enum: ['DeliveryPerson'],
    default: 'DeliveryPerson',
  },
  currentLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  currentOrders: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Driver', DriverSchema);