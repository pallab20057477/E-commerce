# Dual-Role System Implementation

## Overview

The dual-role system allows users who have been approved as vendors to access both their regular user account and their vendor account seamlessly. This provides a complete e-commerce experience where users can both shop and sell on the same platform.

## Key Features

### 🔄 **Role Switching**
- **Seamless Transition**: Users can switch between user and vendor roles
- **Session Persistence**: Login state is maintained across role switches
- **Context Awareness**: UI adapts based on current role

### 🎯 **User Experience**
- **Role Selection Modal**: Appears after login for users with vendor accounts
- **Navbar Role Switcher**: Quick role switching from any page
- **Role-Specific Navigation**: Different menus and routes per role

### 🔒 **Security & Authorization**
- **Role-Based Access**: Routes and features are protected by role
- **Vendor Approval Check**: Only approved vendors can access vendor features
- **Session Management**: Secure token-based authentication

## Implementation Details

### 1. Authentication Context (`AuthContext.js`)

```javascript
// Key state variables
const [user, setUser] = useState(null);           // Regular user data
const [vendor, setVendor] = useState(null);       // Vendor data
const [currentRole, setCurrentRole] = useState('user'); // Current active role
const [isVendorApproved, setIsVendorApproved] = useState(false);

// Key functions
const switchRole = (role) => { /* Switch between user/vendor */ };
const getCurrentUser = () => { /* Return current role's user data */ };
const canAccessVendor = () => { /* Check vendor approval status */ };
```

### 2. Role Selection Modal (`RoleSelectionModal.jsx`)

**Features:**
- **Visual Role Cards**: Clear distinction between user and vendor accounts
- **Approval Status**: Shows vendor approval status
- **Business Information**: Displays vendor business name
- **One-Click Switching**: Instant role transition

**User Flow:**
1. User logs in with email/password
2. System checks if user has vendor account
3. If vendor account exists and is approved, show role selection modal
4. User chooses role (user or vendor)
5. System switches context and redirects appropriately

### 3. Navbar Role Switcher (`RoleSwitcher.jsx`)

**Features:**
- **Current Role Display**: Shows active role with icon
- **Quick Switch**: Dropdown with role switching options
- **User Information**: Displays user name and email
- **Quick Links**: Direct access to role-specific pages
- **Logout Option**: Secure session termination

### 4. Backend API Endpoints

#### Authentication Routes (`/auth`)
```javascript
// Check vendor status for current user
GET /auth/vendor-status
Response: {
  success: true,
  vendor: {
    _id: "vendor_id",
    businessName: "Business Name",
    status: "approved|pending|rejected",
    approvalDate: "2024-01-01",
    isActive: true
  }
}
```

#### Vendor Routes (`/vendors`)
```javascript
// All vendor routes automatically filter by vendor ownership
GET /vendors/products     // Only vendor's products
GET /vendors/orders       // Only orders with vendor's products
GET /vendors/earnings     // Only vendor's earnings
```

## User Flows

### 1. New User Registration
```
User registers → Regular user account created → Can shop and browse
```

### 2. User Applies for Vendor Account
```
User applies → Vendor application created → Admin reviews → Approval/Rejection
```

### 3. Approved Vendor Login
```
User logs in → System detects vendor account → Role selection modal → Choose role
```

### 4. Role Switching During Session
```
User on any page → Click role switcher → Choose new role → Redirect to appropriate dashboard
```

## Security Model

### Role-Based Access Control (RBAC)

#### User Role Permissions:
- ✅ Browse products
- ✅ Add to cart
- ✅ Place orders
- ✅ View order history
- ✅ Manage profile
- ❌ Access vendor features

#### Vendor Role Permissions:
- ✅ All user permissions
- ✅ Manage products
- ✅ View vendor orders
- ✅ Update order status
- ✅ View earnings
- ✅ Access analytics
- ✅ Manage business profile

### Data Isolation

#### Vendor Data Filtering:
```javascript
// All vendor queries automatically filter by vendor ID
const vendor = await Vendor.findOne({ user: req.user._id });
const products = await Product.find({ vendor: vendor._id });
const orders = await Order.find({ 'products.product': { $in: productIds } });
```

#### User Data Access:
```javascript
// Users can only access their own data
const userOrders = await Order.find({ user: req.user._id });
const userProfile = await User.findById(req.user._id);
```

## UI/UX Features

### 1. Visual Indicators
- **Role Icons**: User (👤) vs Vendor (🏪) icons
- **Color Coding**: Different colors for different roles
- **Status Badges**: Approval status indicators

### 2. Responsive Design
- **Mobile-Friendly**: Role switcher works on all devices
- **Touch-Optimized**: Easy tapping on mobile devices
- **Accessible**: Screen reader friendly

### 3. User Feedback
- **Toast Notifications**: Success/error messages
- **Loading States**: Visual feedback during role switches
- **Confirmation Dialogs**: Important action confirmations

## Technical Implementation

### Frontend Components

#### 1. AuthContext Provider
```javascript
// Manages authentication state and role switching
const AuthProvider = ({ children }) => {
  // State management for user, vendor, and current role
  // Methods for login, logout, and role switching
};
```

#### 2. Role Selection Modal
```javascript
// Modal component for choosing role after login
const RoleSelectionModal = ({ isOpen, onClose, onRoleSelect }) => {
  // Visual role cards with business information
  // Approval status indicators
};
```

#### 3. Role Switcher Component
```javascript
// Navbar component for role switching
const RoleSwitcher = () => {
  // Current role display
  // Dropdown with switching options
  // Quick links to role-specific pages
};
```

### Backend Services

#### 1. Authentication Middleware
```javascript
// Validates JWT tokens and user sessions
const auth = async (req, res, next) => {
  // Token validation
  // User data attachment
};
```

#### 2. Vendor Status Check
```javascript
// Checks if user has approved vendor account
const checkVendorStatus = async (userId) => {
  // Query vendor collection
  // Return approval status and business info
};
```

#### 3. Role-Based Route Protection
```javascript
// Protects routes based on user role
const vendorAuth = async (req, res, next) => {
  // Check if user is approved vendor
  // Attach vendor data to request
};
```

## Benefits

### For Users:
- **Seamless Experience**: No need for separate accounts
- **Easy Switching**: Quick role transitions
- **Unified Interface**: Consistent design across roles
- **Data Persistence**: All data maintained across switches

### For Platform:
- **Increased Engagement**: Users can both buy and sell
- **Better Retention**: More reasons to stay on platform
- **Simplified Management**: Single user accounts
- **Scalable Architecture**: Easy to extend with more roles

### For Business:
- **Higher Conversion**: Users become vendors
- **Network Effects**: More sellers attract more buyers
- **Data Insights**: Better understanding of user behavior
- **Revenue Growth**: Commission from vendor sales

## Future Enhancements

### 1. Multi-Role Support
- **Admin Role**: Platform administration
- **Moderator Role**: Content moderation
- **Affiliate Role**: Referral marketing

### 2. Advanced Features
- **Role-Specific Notifications**: Different alerts per role
- **Customizable Dashboards**: Role-based layouts
- **Analytics Integration**: Cross-role insights

### 3. Mobile App Support
- **Native Role Switching**: App-specific implementations
- **Push Notifications**: Role-aware notifications
- **Offline Support**: Role-based offline capabilities

## Conclusion

The dual-role system provides a comprehensive solution for users who want to both shop and sell on the platform. It maintains security while providing a seamless user experience, ultimately driving platform growth and user engagement. 