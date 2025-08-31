const express = require('express');
const vendor = require('../middleware/vendor');
const { auth, adminAuth } = require('../middleware/auth');
const ErrorHandler = require('../middleware/errorHandler');
const vendorController = require('../controllers/vendorController');
const shippingController = require('../controllers/shippingController');
const withdrawalController = require('../controllers/withdrawalController');

const router = express.Router();

// Vendor-protected routes
router.post('/apply', auth, ErrorHandler.asyncHandler(vendorController.applyForVendor));
router.get('/profile', vendor, ErrorHandler.asyncHandler(vendorController.getVendorProfile));
router.put('/profile', vendor, ErrorHandler.asyncHandler(vendorController.updateVendorProfile));
router.get('/dashboard', vendor, ErrorHandler.asyncHandler(vendorController.getVendorDashboard));
router.get('/products', vendor, ErrorHandler.asyncHandler(vendorController.getVendorProducts));
router.post('/products', vendor, ErrorHandler.asyncHandler(vendorController.addVendorProduct));
router.get('/products/:id', vendor, ErrorHandler.asyncHandler(vendorController.getVendorProductById));
router.put('/products/:id', vendor, ErrorHandler.asyncHandler(vendorController.updateVendorProduct));
router.patch('/products/:id/status', vendor, ErrorHandler.asyncHandler(vendorController.updateVendorProductStatus));
router.patch('/products/bulk/status', vendor, ErrorHandler.asyncHandler(vendorController.bulkUpdateVendorProductStatus));
router.delete('/products/bulk', vendor, ErrorHandler.asyncHandler(vendorController.bulkDeleteVendorProducts));
router.delete('/products/:id', vendor, ErrorHandler.asyncHandler(vendorController.deleteVendorProduct));
router.get('/orders', vendor, ErrorHandler.asyncHandler(vendorController.getVendorOrders));
router.patch('/orders/:orderId/item/:itemId/status', vendor, ErrorHandler.asyncHandler(vendorController.updateVendorOrderItemStatus));
router.get('/orders/:orderId', vendor, ErrorHandler.asyncHandler(vendorController.getVendorOrderById));
router.get('/earnings', vendor, ErrorHandler.asyncHandler(vendorController.getVendorEarnings));
router.post('/withdraw', vendor, ErrorHandler.asyncHandler(vendorController.vendorWithdraw));
router.get('/notifications', auth, ErrorHandler.asyncHandler(vendorController.getVendorNotifications));
router.patch('/notifications/:id/read', auth, ErrorHandler.asyncHandler(vendorController.markVendorNotificationRead));
router.patch('/notifications/read-all', auth, ErrorHandler.asyncHandler(vendorController.markAllVendorNotificationsRead));
router.get('/analytics', vendor, ErrorHandler.asyncHandler(vendorController.getVendorAnalytics));
router.get('/analytics/sales', vendor, ErrorHandler.asyncHandler(vendorController.getVendorSalesAnalytics));
router.get('/analytics/products', vendor, ErrorHandler.asyncHandler(vendorController.getVendorProductsAnalytics));
router.get('/analytics/categories', vendor, ErrorHandler.asyncHandler(vendorController.getVendorCategoriesAnalytics));
router.get('/analytics/top-products', vendor, ErrorHandler.asyncHandler(vendorController.getVendorTopProductsAnalytics));

// Vendor Shipping Management
router.get('/shipping', vendor, shippingController.getShippingMethods);
router.post('/shipping', vendor, shippingController.addShippingMethod);
router.put('/shipping/:id', vendor, shippingController.updateShippingMethod);
router.delete('/shipping/:id', vendor, shippingController.deleteShippingMethod);

// Vendor Withdrawals
router.get('/withdrawals/history', vendor, withdrawalController.getWithdrawalHistory);
router.post('/withdrawals/request', vendor, withdrawalController.createWithdrawalRequest);

// Admin routes
router.get('/admin/applications', adminAuth, vendorController.getAllVendorApplications);
router.put('/admin/:id/status', adminAuth, vendorController.updateVendorApplicationStatus);
router.post('/admin/create', adminAuth, vendorController.createVendorByAdmin);
router.put('/admin/:vendorId/deactivate', adminAuth, vendorController.deactivateVendorByAdmin);
router.get('/admin/:vendorId/activity', adminAuth, vendorController.getVendorActivityByAdmin);
router.delete('/admin/:vendorId', adminAuth, vendorController.deleteVendorByAdmin);

// Public store page
router.get('/store/:id', vendorController.getVendorStorePage);

// Vendor: Update status of a vendor's product in an order
router.put('/orders/:orderId/products/:productId/status', auth, vendorController.updateOrderProductStatusByVendor);

module.exports = router;
