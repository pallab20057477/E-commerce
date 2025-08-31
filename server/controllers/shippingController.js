const ShippingMethod = require('../models/ShippingMethod');
const Vendor = require('../models/Vendor');

// Get all shipping methods for the current vendor
exports.getShippingMethods = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const methods = await ShippingMethod.find({ vendor: vendor._id });
    res.json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new shipping method
exports.addShippingMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const { name, regions, cost, estimatedDelivery, isActive } = req.body;
    const method = new ShippingMethod({
      vendor: vendor._id,
      name,
      regions,
      cost,
      estimatedDelivery,
      isActive
    });
    await method.save();
    res.status(201).json({ success: true, method });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a shipping method
exports.updateShippingMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const { id } = req.params;
    const { name, regions, cost, estimatedDelivery, isActive } = req.body;
    const method = await ShippingMethod.findOneAndUpdate(
      { _id: id, vendor: vendor._id },
      { name, regions, cost, estimatedDelivery, isActive },
      { new: true }
    );
    if (!method) return res.status(404).json({ message: 'Shipping method not found' });
    res.json({ success: true, method });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a shipping method
exports.deleteShippingMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const { id } = req.params;
    const method = await ShippingMethod.findOneAndDelete({ _id: id, vendor: vendor._id });
    if (!method) return res.status(404).json({ message: 'Shipping method not found' });
    res.json({ success: true, message: 'Shipping method deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 