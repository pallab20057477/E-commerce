// Example structure for order controller
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

const createOrder = async (req, res) => {
  try {
    const {
      products,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod = 'standard'
    } = req.body;
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No products in order' });
    }
    let totalAmount = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (!product.isActive) {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }
      if (product.mode === 'buy-now') {
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
        totalAmount += product.price * item.quantity;
      } else if (product.mode === 'auction') {
        if (product.auction.winner?.toString() !== req.user._id.toString()) {
          return res.status(400).json({ message: 'You are not the winner of this auction' });
        }
        totalAmount += product.auction.currentBid * item.quantity;
      }
      orderProducts.push({
        product: item.productId,
        quantity: item.quantity,
        price: product.mode === 'auction' ? product.auction.currentBid : product.price,
        mode: product.mode
      });
    }
    const shippingCost = shippingMethod === 'express' ? 15 : 5;
    const order = new Order({
      user: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      shippingMethod,
      shippingCost,
      taxAmount: totalAmount * 0.1,
      auctionDetails: products.find(p => p.mode === 'auction') ? {
        productId: products.find(p => p.mode === 'auction').productId,
        winningBid: totalAmount,
        auctionEndTime: new Date()
      } : undefined
    });
    const savedOrder = await order.save();
    await Notification.create({
      user: req.user._id,
      message: `Your order #${savedOrder._id} has been placed successfully!`,
      type: 'order',
    });
    // Populate the order with product details before sending the response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('products.product', 'name price images')
      .populate('user', 'name email');
    for (const item of products) {
      if (item.mode === 'buy-now') {
        const product = await Product.findById(item.productId);
        product.stock -= item.quantity;
        await product.save();
        
        // Check for low stock and notify vendor
        if (product.stock <= 10 && product.vendor) {
          const vendor = await Vendor.findById(product.vendor);
          if (vendor && vendor.user) {
            const io = req.app.get('io');
            if (io) {
              io.to(vendor.user.toString()).emit('vendor:stock-alert', {
                productId: product._id,
                productName: product.name,
                stock: product.stock,
                threshold: 10
              });
            }
          }
        }
      }
    }
    // Emit real-time event to all admins
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('order:new', populatedOrder);
      
      // Notify vendors of new orders containing their products
      const vendorProducts = await Product.find({
        _id: { $in: order.products.map(p => p.productId) }
      }).populate('vendor', 'user');
      
      const vendorNotifications = {};
      vendorProducts.forEach(product => {
        if (product.vendor && product.vendor.user) {
          const vendorUserId = product.vendor.user.toString();
          if (!vendorNotifications[vendorUserId]) {
            vendorNotifications[vendorUserId] = {
              orderId: order._id,
              orderNumber: order._id.toString().slice(-6),
              total: 0,
              products: []
            };
          }
          
          const orderItem = order.products.find(p => p.productId.toString() === product._id.toString());
          if (orderItem) {
            vendorNotifications[vendorUserId].total += orderItem.price * orderItem.quantity;
            vendorNotifications[vendorUserId].products.push({
              productId: product._id,
              name: product.name,
              quantity: orderItem.quantity,
              price: orderItem.price
            });
          }
        }
      });
      
      // Emit notifications to each vendor
      Object.keys(vendorNotifications).forEach(vendorUserId => {
        io.to(vendorUserId).emit('vendor:new-order', vendorNotifications[vendorUserId]);
      });
      
      // Notify vendors of earnings when payment is completed
      if (order.paymentStatus === 'completed') {
        Object.keys(vendorNotifications).forEach(vendorUserId => {
          const vendorData = vendorNotifications[vendorUserId];
          io.to(vendorUserId).emit('vendor:earnings-update', {
            orderId: order._id,
            amount: vendorData.total,
            commission: vendorData.total * 0.1, // 10% commission
            netEarnings: vendorData.total * 0.9
          });
        });
      }
      
      // Notify user of order creation
      io.to(order.user.toString()).emit('order:created', {
        orderId: order._id,
        orderNumber: order._id.toString().slice(-6),
        total: order.totalAmount,
        status: order.status,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      // Notify users tracking this order
      io.to(`order-${order._id}`).emit('order:update', {
        orderId: order._id,
        status: order.status,
        message: 'Order has been created successfully'
      });
    }
    // Send response with the populated order
    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.getUserOrders(req.user._id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'name images price')
      .populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Update main order status
    order.status = status;
    
    // If order is being marked as delivered or cancelled, update all product statuses
    if (['delivered', 'cancelled'].includes(status)) {
      order.products = order.products.map(product => ({
        ...product.toObject(),
        status: status
      }));
    }
    
    await order.save();
    await Notification.create({
      user: order.user,
      message: `Your order #${order._id} status has been updated to ${status}.`,
      type: 'order',
    });
    const io = req.app.get('io');
    if (io && order.user) {
      io.to(order.user.toString()).emit('order:status', {
        orderId: order._id.toString(),
        status,
        userId: order.user.toString()
      });
      io.to('admins').emit('order:update', order);
      // Real-time admin notification
      io.to('admins').emit('notification:new', {
        message: `Order #${order._id} status updated to ${status} by admin.`,
        type: 'order',
        createdAt: new Date(),
        read: false
      });
      
      // Notify vendors of order status updates
      const vendorProducts = await Product.find({
        _id: { $in: order.products.map(p => p.productId) }
      }).populate('vendor', 'user');
      
      const vendorNotifications = {};
      vendorProducts.forEach(product => {
        if (product.vendor && product.vendor.user) {
          const vendorUserId = product.vendor.user.toString();
          if (!vendorNotifications[vendorUserId]) {
            vendorNotifications[vendorUserId] = {
              orderId: order._id,
              orderNumber: order._id.toString().slice(-6),
              status,
              products: []
            };
          }
          
          const orderItem = order.products.find(p => p.productId.toString() === product._id.toString());
          if (orderItem) {
            vendorNotifications[vendorUserId].products.push({
              productId: product._id,
              name: product.name,
              quantity: orderItem.quantity,
              price: orderItem.price,
              status: orderItem.status || status
            });
          }
        }
      });
      
      // Emit notifications to each vendor
      Object.keys(vendorNotifications).forEach(vendorUserId => {
        io.to(vendorUserId).emit('vendor:order-update', vendorNotifications[vendorUserId]);
      });
    }
    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const order = await Order.findById(req.params.id).populate('products.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }
    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;
    if (paymentStatus === 'completed' && previousPaymentStatus !== 'completed') {
      order.status = 'confirmed';
      // Update product sales and vendor stats
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.sales += item.quantity;
          product.totalRevenue += item.price * item.quantity;
          await product.save();
          if (product.vendor) {
            const vendor = await Vendor.findById(product.vendor);
            if (vendor) {
              vendor.totalSales = (vendor.totalSales || 0) + item.quantity;
              vendor.totalEarnings = (vendor.totalEarnings || 0) + (item.price * item.quantity * 0.9);
              await vendor.save();
            }
          }
        }
      }
    }
    await order.save();
    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePaymentStatusAdmin = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'completed' && order.status === 'pending') {
      order.status = 'confirmed';
    }
    await order.save();
    await Notification.create({
      user: order.user,
      message: `Your payment for order #${order._id.toString().slice(-8)} has been ${paymentStatus}.`,
      type: 'payment',
    });
    const io = req.app.get('io');
    if (io && order.user) {
      io.to(order.user.toString()).emit('payment:status', {
        orderId: order._id.toString(),
        paymentStatus,
        userId: order.user.toString()
      });
      io.to('admins').emit('order:update', order);
      // Real-time admin notification
      io.to('admins').emit('notification:new', {
        message: `Payment for order #${order._id.toString().slice(-8)} updated to ${paymentStatus} by admin.`,
        type: 'payment',
        createdAt: new Date(),
        read: false
      });
    }
    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    order.status = 'cancelled';
    await order.save();
    for (const item of order.products) {
      if (item.mode === 'buy-now') {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    const io = req.app.get('io');
    if (io && order.user) {
      io.to(order.user.toString()).emit('order:status', {
        orderId: order._id.toString(),
        status: 'cancelled',
        userId: order.user.toString()
      });
    }
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrderStatsOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updatePaymentStatusAdmin,
  cancelOrder,
  getOrderStatsOverview,
}; 