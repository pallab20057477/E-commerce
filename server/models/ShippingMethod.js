const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  regions: [{
    type: String
  }],
  cost: {
    type: Number,
    required: true
  },
  estimatedDelivery: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema); 