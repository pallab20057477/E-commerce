# Vendor Order Management System

## 🎯 **Overview**

The vendor order management system ensures that vendors can only see and manage orders containing their own products, while admins have full access to all orders. This maintains proper security boundaries and business logic.

## 🔐 **Security Model**

### **Vendor Access Control**
- ✅ **Vendors can only see orders containing their products**
- ✅ **Vendors can only update status of their own products**
- ✅ **Proper authentication and authorization checks**
- ✅ **Product ownership verification**

### **Admin Access Control**
- ✅ **Admins can see ALL orders**
- ✅ **Admins can update ANY order status**
- ✅ **No product-based restrictions for admins**
- ✅ **Full administrative privileges**

## 🏗️ **Backend Implementation**

### **Vendor Routes** (`/server/routes/vendors.js`)

#### **1. Get Vendor Orders**
```javascript
router.get('/orders', auth, async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  
  // Get vendor's products
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  // Filter orders to only include vendor's products
  const query = {
    'products.product': { $in: productIds }
  };
  
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate('products.product', 'name images price');
});
```

#### **2. Update Order Item Status (Vendor)**
```javascript
router.patch('/orders/:orderId/item/:itemId/status', auth, async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  
  // Find the specific item
  const item = order.products.find(p => p._id.toString() === itemId);
  
  // Verify the product belongs to this vendor
  const product = await Product.findById(item.product);
  if (!product || product.vendor.toString() !== vendor._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this item' });
  }
  
  // Update item status
  item.status = status;
  await order.save();
});
```

#### **3. Get Single Vendor Order**
```javascript
router.get('/orders/:orderId', auth, async (req, res) => {
  // Filter to only show items that belong to this vendor
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const vendorProductIds = vendorProducts.map(p => p._id.toString());

  const filteredOrder = {
    ...order.toObject(),
    products: order.products.filter(item => 
      vendorProductIds.includes(item.product._id.toString())
    )
  };
});
```

### **Admin Routes** (`/server/routes/admin.js`)

#### **1. Get All Orders (Admin)**
```javascript
router.get('/orders', adminAuth, async (req, res) => {
  // No filtering - admins see all orders
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('products.product', 'name images');
});
```

#### **2. Update Order Status (Admin)**
```javascript
// In /server/routes/orders.js
router.put('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  // Admin can update any order status
  order.status = status;
  await order.save();
});
```

## 🎨 **Frontend Implementation**

### **Vendor Order Management**

#### **1. Vendor Orders List** (`VendorOrders.jsx`)
- Shows only orders containing vendor's products
- Displays vendor-specific totals
- Clear indication of vendor's products in each order
- Status filtering and search functionality

#### **2. Vendor Order Detail** (`VendorOrderDetail.jsx`)
- Shows only vendor's products in the order
- Status update buttons for vendor's products only
- Clear warnings about multi-vendor orders
- Professional UI with loading states

#### **3. Key Features**
- **Product Filtering**: Only shows vendor's products
- **Status Updates**: Real-time status updates with proper validation
- **Error Handling**: Comprehensive error messages
- **Loading States**: Professional loading indicators
- **Notifications**: Toast notifications for user feedback

## 🔄 **Order Status Flow**

### **Vendor-Controlled Statuses**
1. **pending** → **processing** (Vendor starts processing)
2. **processing** → **shipped** (Vendor ships the item)
3. **shipped** → **out-for-delivery** (In transit)
4. **out-for-delivery** → **nearest-area** (Near customer)
5. **nearest-area** → **delivered** (Delivered to customer)

### **Admin-Controlled Statuses**
- Admins can update any order status
- Can override vendor statuses if needed
- Full administrative control

## 🛡️ **Security Features**

### **1. Authentication**
- JWT token-based authentication
- Role-based access control (vendor, admin, user)

### **2. Authorization**
- Vendor can only access their own products
- Product ownership verification
- Route-level protection

### **3. Data Filtering**
- Backend filters data before sending to frontend
- Frontend double-checks for additional security
- No sensitive data leakage

### **4. Input Validation**
- Status validation against allowed values
- Product ID validation
- Order ID validation

## 📊 **Business Logic**

### **Multi-Vendor Orders**
- Single order can contain products from multiple vendors
- Each vendor only sees and manages their own products
- Order total shows vendor-specific amounts
- Clear separation of responsibilities

### **Order Processing**
- Vendors process their products independently
- Order status reflects overall order state
- Individual product statuses tracked separately
- Real-time updates via Socket.IO

### **Revenue Tracking**
- Vendors see earnings from their products only
- Commission calculations per vendor
- Separate payout processing

## 🚀 **Real-Time Features**

### **Socket.IO Integration**
- Real-time order status updates
- Instant notifications to customers
- Live dashboard updates
- Order processing notifications

### **Status Synchronization**
- Immediate UI updates
- Cross-tab synchronization
- Mobile-responsive updates
- Offline queue handling

## 📱 **User Experience**

### **Vendor Dashboard**
- Clear overview of vendor's orders
- Quick status update buttons
- Order filtering and search
- Professional interface

### **Order Management**
- Intuitive status progression
- Clear product identification
- Customer information display
- Shipping address details

### **Notifications**
- Toast notifications for actions
- Error message handling
- Success confirmations
- Loading state indicators

## 🔧 **Technical Implementation**

### **API Endpoints**
```
GET    /vendors/orders              - Get vendor's orders
GET    /vendors/orders/:id          - Get vendor's order detail
PATCH  /vendors/orders/:id/item/:itemId/status - Update item status
GET    /admin/orders                - Get all orders (admin)
PUT    /orders/:id/status           - Update order status (admin)
```

### **Database Queries**
- Efficient product filtering
- Optimized order lookups
- Proper indexing for performance
- Aggregation for statistics

### **Error Handling**
- Comprehensive error messages
- Proper HTTP status codes
- User-friendly error display
- Logging for debugging

## ✅ **Testing Scenarios**

### **Vendor Access Tests**
1. Vendor can only see orders with their products
2. Vendor cannot update other vendors' products
3. Vendor cannot access admin-only routes
4. Multi-vendor order filtering works correctly

### **Admin Access Tests**
1. Admin can see all orders
2. Admin can update any order status
3. Admin can override vendor statuses
4. Admin has full system access

### **Security Tests**
1. Unauthorized access is blocked
2. Product ownership is verified
3. Token validation works correctly
4. Data filtering prevents leaks

## 🎯 **Benefits**

### **For Vendors**
- Clear view of their orders only
- Easy status management
- Professional interface
- Real-time updates

### **For Admins**
- Full system oversight
- Complete order management
- Override capabilities
- Comprehensive analytics

### **For Customers**
- Accurate order tracking
- Real-time status updates
- Clear communication
- Professional experience

This system ensures proper separation of concerns, maintains security boundaries, and provides a professional order management experience for all user types. 