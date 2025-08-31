const WithdrawalRequest = require('../models/WithdrawalRequest');
const Vendor = require('../models/Vendor');

// Get withdrawal history for current vendor
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const withdrawals = await WithdrawalRequest.find({ vendor: vendor._id }).sort({ requestedAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new withdrawal request
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const { amount, payoutMethod, notes } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }
    // Optionally: Check vendor's available balance here
    const withdrawal = new WithdrawalRequest({
      vendor: vendor._id,
      amount,
      payoutMethod,
      notes
    });
    await withdrawal.save();
    res.status(201).json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 