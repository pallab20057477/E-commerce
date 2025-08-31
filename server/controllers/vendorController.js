const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const ProductService = require('../services/productService');
const ErrorHandler = require('../middleware/errorHandler');

// Vendor Application & Profile Management
const applyForVendor = async (req, res) => {
  const {
    businessName,
    businessDescription,
    businessAddress,
    contactInfo,
    businessType,
    taxId,
    bankInfo,
    categories,
    documents
  } = req.body;

  const existingVendor = await Vendor.findOne({ user: req.user._id, status: 'approved' });
  if (existingVendor) {
    throw ErrorHandler.createBusinessError('You already have a vendor account', 400);
  }

  const vendor = new Vendor({
    user: req.user._id,
    businessName,
    businessDescription,
    businessAddress,
    contactInfo,
    businessType,
    taxId,
    bankInfo,
    categories,
    documents
  });

  await vendor.save();
  await User.findByIdAndUpdate(req.user._id, { role: 'vendor' });
  res.status(201).json({ success: true, message: 'Vendor application submitted successfully', vendor });
};

const getVendorProfile = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id }).populate('user', 'name email');
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  res.json({ success: true, vendor });
};

const updateVendorProfile = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);

  const updateFields = req.body;
  Object.keys(updateFields).forEach(key => {
    if (key !== 'status' && key !== 'approvalDate' && key !== 'approvedBy') {
      vendor[key] = updateFields[key];
    }
  });

  await vendor.save();
  res.json({ success: true, message: 'Vendor profile updated successfully', vendor });
};

// Dashboard & Analytics
const getVendorDashboard = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);

  // Gather vendor product IDs once
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  const recentOrders = await Order.find({
    'products.product': { $in: productIds }
  })
    .populate('user', 'name email')
    .populate('products.product', 'name images')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentProducts = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 }).limit(5);

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  // Compute monthly earnings specific to this vendor by summing item-level revenue
  const monthlyEarningsAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentMonth },
        paymentStatus: 'completed'
      }
    },
    { $unwind: '$products' },
    { $match: { 'products.product': { $in: productIds } } },
    {
      $group: {
        _id: null,
        total: {
          $sum: { $multiply: [ { $ifNull: ['$products.price', 0] }, { $ifNull: ['$products.quantity', 1] } ] }
        }
      }
    }
  ]);

  const pendingProducts = await Product.countDocuments({ vendor: vendor._id, approvalStatus: 'pending' });

  // Compute overall totals for this vendor from completed orders
  const totalsAgg = await Order.aggregate([
    { $match: { paymentStatus: 'completed' } },
    { $unwind: '$products' },
    { $match: { 'products.product': { $in: productIds } } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $ifNull: ['$products.quantity', 1] } },
        grossRevenue: {
          $sum: { $multiply: [ { $ifNull: ['$products.price', 0] }, { $ifNull: ['$products.quantity', 1] } ] }
        }
      }
    }
  ]);

  const grossRevenue = totalsAgg[0]?.grossRevenue || 0;
  const totalSales = totalsAgg[0]?.totalSales || 0;
  const commissionRate = vendor.commissionRate ?? 10;
  const netEarnings = grossRevenue * (1 - commissionRate / 100);

  res.json({
    success: true,
    vendor,
    stats: {
      totalProducts: vendor.totalProducts,
      totalSales,
      // Expose net earnings (consistent with previous meaning of totalEarnings)
      totalEarnings: netEarnings,
      monthlyEarnings: monthlyEarningsAgg[0]?.total || 0,
      pendingProducts
    },
    recentOrders,
    recentProducts
  });
};

// Product Management
const getVendorProducts = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  const result = await ProductService.getVendorProducts(vendor._id, req.query);
  res.json({ success: true, ...result });
};

const addVendorProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          type: 'VENDOR_ERROR', 
          message: 'Vendor account not found' 
        } 
      });
    }

    const { images, ...productData } = req.body;

    if (productData.category) {
      productData.category = productData.category.trim();
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          type: 'IMAGE_ERROR', 
          message: 'At least one product image URL is required' 
        } 
      });
    }

    // Enforce a maximum of 5 images on the server side
    if (images.length > 5) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'IMAGE_LIMIT',
          message: 'Maximum 5 images are allowed per product'
        }
      });
    }

    const result = await ProductService.createProduct(
      { ...productData, images }, 
      vendor._id, 
      req.user._id
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Product creation error:', error);
    
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Product validation failed',
          details: error.validationErrors
        }
      });
    }

    const errorResponse = ErrorHandler.createErrorResponse(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
};

const getVendorProductById = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) throw ErrorHandler.createBusinessError('Product not found', 404);
  res.json({ success: true, product });
};

const updateVendorProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return res.status(404).json({ message: 'Vendor account not found' });
  
  const { images, ...productData } = req.body;
  const result = await ProductService.updateProduct(
    req.params.id, 
    { ...productData, images }, 
    vendor._id, 
    req.user._id
  );
  res.json(result);
};

const updateVendorProductStatus = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { isActive } = req.body;
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) throw ErrorHandler.createBusinessError('Product not found', 404);
  
  product.isActive = isActive;
  await product.save();
  
  res.json({ success: true, message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`, product });
};

const bulkUpdateVendorProductStatus = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { productIds, isActive } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw ErrorHandler.createBusinessError('Product IDs are required', 400);
  }
  
  const result = await Product.updateMany(
    { _id: { $in: productIds }, vendor: vendor._id }, 
    { isActive }
  );
  
  res.json({ 
    success: true, 
    message: `${result.modifiedCount} products ${isActive ? 'activated' : 'deactivated'} successfully`, 
    modifiedCount: result.modifiedCount 
  });
};

const bulkDeleteVendorProducts = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { productIds } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw ErrorHandler.createBusinessError('Product IDs are required', 400);
  }
  
  const result = await Product.deleteMany({ _id: { $in: productIds }, vendor: vendor._id });
  await ProductService.updateVendorStats(vendor._id);
  
  res.json({ 
    success: true, 
    message: `${result.deletedCount} products deleted successfully`, 
    deletedCount: result.deletedCount 
  });
};

const deleteVendorProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) throw ErrorHandler.createBusinessError('Product not found', 404);
  
  if (product.mode === 'auction' && product.auction && product.auction.status !== 'scheduled') {
    return res.status(400).json({ message: 'Cannot delete auction product after auction has started' });
  }
  
  await Product.findByIdAndDelete(req.params.id);
  await ProductService.updateVendorStats(vendor._id);
  
  res.json({ success: true, message: 'Product deleted successfully' });
};

// Order Management
const getVendorOrders = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;
  
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);
  
  const query = { 'products.product': { $in: productIds } };
  if (status) query.status = status;
  
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .populate('products.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query)
  ]);
  
  res.json({ 
    success: true, 
    orders, 
    total, 
    totalPages: Math.ceil(total / limit), 
    currentPage: parseInt(page) 
  });
};

const updateVendorOrderItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId, itemId } = req.params;
    
    const validStatuses = ['processing', 'shipped', 'out-for-delivery', 'nearest-area', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const item = order.products.find(p => p._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    const product = await Product.findById(item.product);
    if (!product || product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    // Update the item status
    item.status = status;
    
    // If marking as delivered, check if all items are delivered
    if (status === 'delivered') {
      const allItemsDelivered = order.products.every(p => p.status === 'delivered');
      if (allItemsDelivered) {
        order.status = 'delivered';
      }
    }
    
    await order.save();
    
    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(order.user.toString()).emit('order:item-status', {
        orderId: order._id.toString(),
        itemId: item._id.toString(),
        status: status,
        productName: product.name
      });
    }
    
    await Notification.create({
      user: order.user,
      message: `Your order #${order._id.slice(-8)} item "${product.name}" status has been updated to ${status}.`,
      type: 'order',
    });
    
    res.json({ 
      message: 'Item status updated successfully', 
      order,
      updatedItem: {
        ...item.toObject(),
        productName: product.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVendorOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('products.product', 'name images price vendor')
      .populate('products.vendor', 'businessName');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const vendorProductIds = vendorProducts.map(p => p._id.toString());
    
    const filteredOrder = {
      ...order.toObject(),
      products: order.products.filter(item => 
        vendorProductIds.includes(item.product._id.toString())
      )
    };
    
    res.json(filteredOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Financial Management
const getVendorEarnings = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { period = '30' } = req.query;
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);
  
  const earnings = await Order.aggregate([
    { $match: { 'products.product': { $in: productIds }, createdAt: { $gte: startDate }, paymentStatus: 'completed' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  const totalEarnings = earnings.reduce((sum, day) => sum + day.total, 0);
  const commissionRate = 10;
  const netEarnings = totalEarnings * (1 - commissionRate / 100);
  
  res.json({ 
    success: true, 
    dailyEarnings: earnings, 
    totalEarnings, 
    netEarnings, 
    commissionRate 
  });
};

const vendorWithdraw = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { amount } = req.body;
    if (!amount || amount <= 0) throw ErrorHandler.createBusinessError('Invalid withdrawal amount', 400);
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    const totalEarnings = await Order.aggregate([
      { $match: { 'products.product': { $in: productIds }, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const grossEarnings = totalEarnings[0]?.total || 0;
    const commissionRate = 10;
    const netEarnings = grossEarnings * (1 - commissionRate / 100);
    
    if (amount > netEarnings) throw ErrorHandler.createBusinessError('Insufficient balance for withdrawal', 400);
    
    const withdrawalRequest = { 
      vendor: vendor._id, 
      amount, 
      status: 'pending', 
      requestedAt: new Date(), 
      processedAt: null 
    };
    
    res.json({ success: true, message: 'Withdrawal request submitted successfully', withdrawalRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Notifications
const getVendorNotifications = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  
  const notifications = await Notification.find({ 
    user: req.user._id, 
    type: { $in: ['order', 'product', 'vendor'] } 
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);
  
  const total = await Notification.countDocuments({ 
    user: req.user._id, 
    type: { $in: ['order', 'product', 'vendor'] } 
  });
  
  res.json({ 
    success: true, 
    notifications, 
    total, 
    totalPages: Math.ceil(total / limit), 
    currentPage: parseInt(page) 
  });
};

const markVendorNotificationRead = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  
  if (!notification) throw ErrorHandler.createBusinessError('Notification not found', 404);
  res.json({ success: true, message: 'Notification marked as read', notification });
};

const markAllVendorNotificationsRead = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  await Notification.updateMany(
    { 
      user: req.user._id, 
      type: { $in: ['order', 'product', 'vendor'] }, 
      read: false 
    }, 
    { read: true }
  );
  
  res.json({ success: true, message: 'All notifications marked as read' });
};

// Analytics
const getVendorAnalytics = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { period = '30' } = req.query;
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  // Get sales data
  const salesData = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get top products by actual completed order items within the period
  // Aggregate on orders to compute sales and revenue per product
  const orderTopProducts = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    { $unwind: '$products' },
    {
      $match: {
        'products.product': { $in: productIds }
      }
    },
    {
      $group: {
        _id: '$products.product',
        sales: { $sum: { $ifNull: ['$products.quantity', 1] } },
        revenue: { $sum: { $multiply: [ { $ifNull: ['$products.quantity', 1] }, { $ifNull: ['$products.price', 0] } ] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  // Enrich with product details for name/category/image
  const topProductIds = orderTopProducts.map(p => p._id);
  const topProductDocs = await Product.find({ _id: { $in: topProductIds } })
    .select('name category images');
  const productInfoMap = new Map(topProductDocs.map(doc => [doc._id.toString(), doc]));

  const topProducts = orderTopProducts.map(p => {
    const info = productInfoMap.get(p._id.toString());
    return {
      _id: p._id,
      name: info?.name || 'Unknown Product',
      category: info?.category || 'Other',
      image: info?.images?.[0] || null,
      sales: p.sales || 0,
      revenue: p.revenue || 0
    };
  });

  // Get customer metrics
  const customerOrders = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalCustomers = customerOrders.length;
  const repeatCustomers = customerOrders.filter(c => c.orderCount > 1).length;
  const averageRating = 4.5; // Placeholder - would need to calculate from reviews
  const growthRate = 15.5; // Placeholder - would need to calculate from previous period

  const customerMetrics = {
    totalCustomers,
    repeatCustomers,
    averageRating,
    growthRate
  };

  // Get revenue trends
  const revenueTrends = [
    {
      period: 'This Week',
      revenue: salesData.slice(-7).reduce((sum, day) => sum + day.revenue, 0),
      change: 12.5,
      description: 'Compared to last week'
    },
    {
      period: 'This Month',
      revenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
      change: 8.3,
      description: 'Compared to last month'
    },
    {
      period: 'This Quarter',
      revenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
      change: 22.1,
      description: 'Compared to last quarter'
    }
  ];

  // Get product performance
  const productPerformance = topProducts.map(product => ({
    ...product,
    revenue: product.revenue || 0
  }));

  res.json({ 
    success: true, 
    salesData,
    topProducts,
    customerMetrics,
    revenueTrends,
    productPerformance
  });
};

const getVendorSalesAnalytics = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { period = '30' } = req.query;
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);
  
  const salesAnalytics = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.json({ success: true, salesAnalytics });
};

const getVendorProductsAnalytics = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { period = '30' } = req.query;
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const productsAnalytics = await Product.aggregate([
    {
      $match: {
        vendor: vendor._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$approvalStatus',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Ensure we return an array with proper structure
  const statusCounts = productsAnalytics.map(item => ({
    status: item._id || 'unknown',
    count: item.count || 0
  }));
  
  res.json({ success: true, data: statusCounts });
};

const getVendorCategoriesAnalytics = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const categoriesAnalytics = await Product.aggregate([
    {
      $match: { vendor: vendor._id }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSales: { $sum: '$sales' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Ensure we return an array with proper structure
  const categoryData = categoriesAnalytics.map(item => ({
    _id: item._id || 'Unknown',
    count: item.count || 0,
    totalSales: item.totalSales || 0
  }));
  
  res.json({ success: true, data: categoryData });
};

const getVendorTopProductsAnalytics = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const topProducts = await Product.find({ vendor: vendor._id })
    .sort({ sales: -1 })
    .limit(10)
    .select('name price sales category');
  
  res.json({ success: true, topProducts });
};

const getAllVendorApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    
    const [applications, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      applications,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateOrderProductStatusByVendor = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['processing', 'shipped', 'out-for-delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const product = await Product.findOne({ _id: productId, vendor: vendor._id });
    if (!product) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    const orderItem = order.products.find(item => 
      item.product.toString() === productId
    );
    
    if (!orderItem) {
      return res.status(404).json({ message: 'Product not found in order' });
    }
    
    orderItem.status = status;
    await order.save();
    
    await Notification.create({
      user: order.user,
      message: `Your order #${order._id.slice(-8)} item "${product.name}" status has been updated to ${status}.`,
      type: 'order',
    });
    
    res.json({ message: 'Product status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin functions
const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      vendors,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('user', 'name email');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    
    const [applications, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      applications,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateVendorApplicationStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor application not found' });
    }
    
    vendor.status = status;
    vendor.approvalDate = new Date();
    vendor.approvedBy = req.user._id;
    
    if (reason) vendor.rejectionReason = reason;
    
    await vendor.save();
    
    // Update user role if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(vendor.user, { role: 'vendor' });
    }
    
    res.json({ success: true, message: `Vendor application ${status}`, vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createVendorByAdmin = async (req, res) => {
  try {
    const vendorData = req.body;
    const vendor = new Vendor(vendorData);
    await vendor.save();
    
    // Update user role
    await User.findByIdAndUpdate(vendorData.user, { role: 'vendor' });
    
    res.status(201).json({ success: true, message: 'Vendor created successfully', vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deactivateVendorByAdmin = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    vendor.status = 'deactivated';
    vendor.deactivatedAt = new Date();
    vendor.deactivatedBy = req.user._id;
    
    await vendor.save();
    
    // Deactivate all products
    await Product.updateMany({ vendor: vendor._id }, { isActive: false });
    
    res.json({ success: true, message: 'Vendor deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorActivityByAdmin = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId).populate('user', 'name email');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    const [totalProducts, totalOrders, totalEarnings] = await Promise.all([
      Product.countDocuments({ vendor: vendor._id }),
      Order.countDocuments({ 'products.product': { $in: await Product.find({ vendor: vendor._id }).select('_id') } }),
      Order.aggregate([
        { $match: { 'products.product': { $in: await Product.find({ vendor: vendor._id }).select('_id') } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const recentActivity = await Order.find({ 
      'products.product': { $in: await Product.find({ vendor: vendor._id }).select('_id') } 
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      vendor,
      stats: {
        totalProducts,
        totalOrders,
        totalEarnings: totalEarnings[0]?.total || 0
      },
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorStorePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find vendor by ID
    const vendor = await Vendor.findById(id)
      .populate('user', 'name email')
      .select('-bankInfo -taxId -documents');
    
    if (!vendor || vendor.status !== 'approved') {
      return res.status(404).json({ 
        success: false, 
        error: 'Vendor store not found' 
      });
    }

    // Get vendor's active products
    const products = await Product.find({ 
      vendor: vendor._id, 
      isActive: true,
      approvalStatus: 'approved'
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Get vendor stats
    const totalProducts = await Product.countDocuments({ 
      vendor: vendor._id, 
      isActive: true,
      approvalStatus: 'approved'
    });

    const vendorStats = {
      totalProducts,
      totalSales: vendor.totalSales || 0,
      rating: vendor.rating || 0,
      joinedDate: vendor.createdAt
    };

    res.json({
      success: true,
      vendor: {
        _id: vendor._id,
        businessName: vendor.businessName,
        businessDescription: vendor.businessDescription,
        businessAddress: vendor.businessAddress,
        contactInfo: vendor.contactInfo,
        businessType: vendor.businessType,
        categories: vendor.categories,
        rating: vendor.rating,
        totalSales: vendor.totalSales,
        totalProducts: vendor.totalProducts,
        createdAt: vendor.createdAt,
        user: vendor.user
      },
      products,
      stats: vendorStats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const deleteVendorByAdmin = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor not found', 404);
    }
    
    // Delete all products associated with this vendor
    await Product.deleteMany({ vendor: vendorId });
    
    // Delete the vendor
    await Vendor.findByIdAndDelete(vendorId);
    
    // Update user role back to customer
    await User.findByIdAndUpdate(vendor.user, { role: 'customer' });
    
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  applyForVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorDashboard,
  getVendorProducts,
  addVendorProduct,
  getVendorProductById,
  updateVendorProduct,
  updateVendorProductStatus,
  bulkUpdateVendorProductStatus,
  bulkDeleteVendorProducts,
  deleteVendorProduct,
  getVendorOrders,
  updateVendorOrderItemStatus,
  getVendorOrderById,
  getVendorEarnings,
  vendorWithdraw,
  getVendorNotifications,
  markVendorNotificationRead,
  markAllVendorNotificationsRead,
  getVendorAnalytics,
  getVendorSalesAnalytics,
  getVendorProductsAnalytics,
  getVendorCategoriesAnalytics,
  getVendorTopProductsAnalytics,
  getAllVendorApplications,
  getAllVendors,
  getVendorById,
  getVendorApplications,
  updateVendorApplicationStatus,
  createVendorByAdmin,
  deactivateVendorByAdmin,
  getVendorActivityByAdmin,
  deleteVendorByAdmin,
  getVendorStorePage,
  updateOrderProductStatusByVendor
};
