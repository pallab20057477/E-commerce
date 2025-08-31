# 🔐 Admin Setup Guide

## Predefined Admin System

This system uses **predefined admin users only**. Regular users cannot become admins through the interface.

## 🚀 Quick Setup

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
```

### 2. Create Predefined Admin Users
```bash
cd server
node createAdmin.js
```

### 3. Start the Frontend
```bash
cd client
npm install
npm start
```

## 👥 Predefined Admin Accounts

After running the setup script, you'll have these admin accounts:

| Name | Email | Password | Role |
|------|-------|----------|------|
| Super Admin | admin@bidcart.com | admin123 | admin |
| System Administrator | system@bidcart.com | system123 | admin |
| Platform Manager | manager@bidcart.com | manager123 | admin |

## 🔗 Access URLs

- **Login Page**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin
- **User Management**: http://localhost:3000/admin/users
- **Product Management**: http://localhost:3000/admin/products
- **Order Management**: http://localhost:3000/admin/orders

## 🔒 Security Features

### Backend Protection:
- ✅ Role changes are prevented in the User model
- ✅ Admin middleware protects admin routes
- ✅ JWT authentication required for all admin actions

### Frontend Protection:
- ✅ AdminRoute component protects admin pages
- ✅ Role-based navigation and access control
- ✅ Automatic redirect for non-admin users

## ⚠️ Important Security Notes

1. **Change Default Passwords**: Change the default passwords after first login
2. **Environment Variables**: Set proper JWT_SECRET in your .env file
3. **Database Security**: Ensure MongoDB is properly secured
4. **HTTPS**: Use HTTPS in production

## 🛠️ Admin Features

### Available Admin Functions:
- ✅ User Management (view, activate/deactivate, delete)
- ✅ Product Management (CRUD operations)
- ✅ Order Management (view, update status)
- ✅ Vendor Management
- ✅ Coupon Management
- ✅ Token Management
- ✅ Dispute Resolution
- ✅ Analytics Dashboard

### Restricted Functions:
- ❌ Creating new admin users through interface
- ❌ Changing user roles through interface
- ❌ Deleting admin users
- ❌ Deactivating admin users

## 🔧 Adding New Admins

To add new admin users, you must:

1. **Edit the `createAdmin.js` script**
2. **Add new admin data to the `adminUsers` array**
3. **Run the script again**

Example:
```javascript
{
  name: 'New Admin',
  email: 'newadmin@bidcart.com',
  password: 'newadmin123',
  role: 'admin',
  phone: '+1234567893',
  isVerified: true
}
```

## 🚨 Emergency Access

If you lose access to all admin accounts, you can:

1. **Connect to MongoDB directly**
2. **Update a user's role to 'admin'**
3. **Or run the createAdmin script again**

```javascript
// MongoDB command to make a user admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

---

**Remember**: This system is designed for security. Only predefined admins can access admin features! 