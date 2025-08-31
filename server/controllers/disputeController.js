const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const createDispute = async (req, res) => {
  try {
    const {
      title,
      description,
      respondentId,
      orderId,
      productId,
      category,
      priority,
      evidence
    } = req.body;
    if (!title || !description || !respondentId || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const respondent = await User.findById(respondentId);
    if (!respondent) {
      return res.status(404).json({ message: 'Respondent not found' });
    }
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
    }
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }
    if (!evidence || !Array.isArray(evidence)) {
      return res.status(400).json({ message: 'Evidence must be an array of { type, url }' });
    }
    const dispute = new Dispute({
      title,
      description,
      complainant: req.user.id,
      respondent: respondentId,
      order: orderId,
      product: productId,
      category,
      priority: priority || 'medium',
      evidence
    });
    await dispute.save();
    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserDisputes = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const query = {
      $or: [
        { complainant: req.user.id },
        { respondent: req.user.id }
      ]
    };
    if (status) query.status = status;
    if (category) query.category = category;
    const disputes = await Dispute.find(query)
      .populate('complainant respondent', 'name email')
      .populate('order', 'orderNumber totalAmount')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Dispute.countDocuments(query);
    res.json({
      disputes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('complainant respondent', 'name email')
      .populate('order', 'orderNumber totalAmount status')
      .populate('product', 'name images price')
      .populate('messages.sender', 'name email')
      .populate('resolvedBy', 'name email');
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    if (dispute.complainant._id.toString() !== req.user.id && 
        dispute.respondent._id.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(dispute);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addDisputeMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    if (dispute.complainant.toString() !== req.user.id && 
        dispute.respondent.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          type: path.extname(file.originalname).toLowerCase() === '.pdf' ? 'document' : 'image',
          filename: file.filename,
          originalName: file.originalname,
          url: `/uploads/disputes/${file.filename}`,
          uploadedBy: req.user.id
        });
      });
    }
    dispute.messages.push({
      sender: req.user.id,
      message,
      attachments
    });
    await dispute.save();
    await dispute.populate('messages.sender', 'name email');
    // Real-time update for dispute messages
    const io = req.app.get('io');
    if (io) {
      io.to(dispute.complainant.toString()).emit('dispute:message', {
        disputeId: dispute._id,
        message: dispute.messages[dispute.messages.length - 1]
      });
      io.to(dispute.respondent.toString()).emit('dispute:message', {
        disputeId: dispute._id,
        message: dispute.messages[dispute.messages.length - 1]
      });
    }
    res.json({
      message: 'Message added successfully',
      newMessage: dispute.messages[dispute.messages.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addDisputeEvidence = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    if (dispute.complainant.toString() !== req.user.id && 
        dispute.respondent.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { evidence } = req.body;
    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
      return res.status(400).json({ message: 'No evidence provided' });
    }
    dispute.evidence.push(...evidence);
    await dispute.save();
    res.json({
      message: 'Evidence added successfully',
      evidence: evidence
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDisputeStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    dispute.status = status;
    if (notes) {
      dispute.internalNotes = notes;
    }
    await dispute.save();
    // Real-time update for dispute status
    const io = req.app.get('io');
    if (io) {
      io.to(dispute.complainant.toString()).emit('dispute:status', {
        disputeId: dispute._id,
        status: dispute.status
      });
      io.to(dispute.respondent.toString()).emit('dispute:status', {
        disputeId: dispute._id,
        status: dispute.status
      });
    }
    res.json({
      message: 'Dispute status updated successfully',
      dispute
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { resolution, resolutionAmount, resolutionNotes } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    await dispute.resolve(resolution, resolutionAmount, resolutionNotes, req.user.id);
    if (resolution === 'refund_full' || resolution === 'refund_partial') {
      // Integrate with payment system to process refunds if needed
    }
    if (resolution === 'account_suspended') {
      const userToSuspend = dispute.respondent;
      await User.findByIdAndUpdate(userToSuspend, { 
        status: 'suspended',
        suspendedAt: Date.now(),
        suspensionReason: `Dispute resolution: ${resolutionNotes}`
      });
    }
    await dispute.populate('complainant respondent', 'name email');
    // Real-time update for dispute status
    const io = req.app.get('io');
    if (io) {
      io.to(dispute.complainant.toString()).emit('dispute:status', {
        disputeId: dispute._id,
        status: dispute.status
      });
      io.to(dispute.respondent.toString()).emit('dispute:status', {
        disputeId: dispute._id,
        status: dispute.status
      });
    }
    res.json({
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const escalateDispute = async (req, res) => {
  try {
    const { escalationReason } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    await dispute.escalate(escalationReason, req.user.id);
    // Real-time update for dispute status
    const io = req.app.get('io');
    if (io) {
      io.to(dispute.complainant.toString()).emit('dispute:status', {
        disputeId: dispute._id,
        status: dispute.status
      });
      io.to(dispute.respondent.toString()).emit('dispute:status', {
        disputeId: dispute._id,
        status: dispute.status
      });
    }
    res.json({
      message: 'Dispute escalated successfully',
      dispute
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllDisputesAdmin = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    const disputes = await Dispute.find(query)
      .populate('complainant respondent', 'name email')
      .populate('order', 'orderNumber totalAmount')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Dispute.countDocuments(query);
    res.json({
      disputes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getDisputeStats = async (req, res) => {
  try {
    const stats = await Dispute.getStats();
    const overdueDisputes = await Dispute.getOverdueDisputes();
    const totalDisputes = await Dispute.countDocuments();
    const openDisputes = await Dispute.countDocuments({ status: 'open' });
    const resolvedDisputes = await Dispute.countDocuments({ status: 'resolved' });
    res.json({
      stats,
      totalDisputes,
      openDisputes,
      resolvedDisputes,
      overdueDisputes: overdueDisputes.length,
      overdueDisputesList: overdueDisputes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    dispute.evidence.forEach(evidence => {
      const filePath = path.join(__dirname, '..', evidence.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    await Dispute.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dispute deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createDispute,
  getUserDisputes,
  getDisputeById,
  addDisputeMessage,
  addDisputeEvidence,
  updateDisputeStatus,
  resolveDispute,
  escalateDispute,
  getAllDisputesAdmin,
  getDisputeStats,
  deleteDispute,
}; 