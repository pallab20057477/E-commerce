import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AdminDataProvider } from './contexts/AdminDataContext';
import { useSocketEvents } from './hooks/useSocketEvents';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import ProductApproval from './pages/admin/ProductApproval';
import AdminUsers from './pages/admin/Users';
import VendorManagement from './pages/admin/VendorManagement';
import AddVendor from './pages/admin/AddVendor';
import AddUser from './pages/admin/AddUser';
import AdminAddProduct from './pages/admin/AddProduct';
import AuctionScheduler from './pages/admin/AuctionScheduler';
import CouponManager from './components/coupons/CouponManager';
// import EditUser from './pages/admin/EditUser';
import VendorApplication from './pages/vendor/VendorApplication';
import VendorRequest from './pages/VendorRequest';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorAddProduct from './pages/vendor/AddProduct';
import EditProduct from './pages/vendor/EditProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorOrderDetail from './pages/vendor/VendorOrderDetail';
import VendorEarnings from './pages/vendor/VendorEarnings';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorRequestManagement from './components/admin/VendorRequestManagement';
import AccountsManagement from './pages/admin/AccountsManagement';
import ActiveAuctions from './pages/admin/ActiveAuctions';
import AuctionDetail from './pages/admin/AuctionDetail';
import AddFeature from './pages/admin/AddFeature';
import AddAuctionProduct from './pages/admin/AddAuctionProduct';
import Notifications from './pages/Notifications';
import Auction from './pages/Auction';
import VendorShipping from './pages/vendor/VendorShipping';
import VendorWithdrawalsHistory from './pages/vendor/VendorWithdrawalsHistory';
import VendorWithdrawalsRequest from './pages/vendor/VendorWithdrawalsRequest';
import VendorLayout from './components/vendor/VendorLayout';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import VendorRoute from './components/auth/VendorRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <NotificationProvider>
            <AdminDataProvider>
            <Router>
              <div className="min-h-screen bg-base-100">
                <Navbar />
                <main className="container mx-auto px-4 py-8 pt-20">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/auction" element={<Auction />} />
                    
                    {/* Protected Routes */}
                    <Route path="/cart" element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    } />
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders/:orderId" element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor-request" element={
                      <ProtectedRoute>
                        <VendorRequest />
                      </ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    } />
                    
                    {/* Vendor Routes */}
                    <Route path="/vendor/apply" element={
                      <ProtectedRoute>
                        <VendorApplication />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor" element={
                      <VendorRoute>
                        <VendorLayout />
                      </VendorRoute>
                    }>
                      <Route index element={<VendorDashboard />} />
                      <Route path="dashboard" element={<VendorDashboard />} />
                      <Route path="products" element={<VendorProducts />} />
                      <Route path="products/add" element={<VendorAddProduct />} />
                      <Route path="products/edit/:id" element={<EditProduct />} />
                      <Route path="orders" element={<VendorOrders />} />
                      <Route path="orders/:orderId" element={<VendorOrderDetail />} />
                      <Route path="earnings" element={<VendorEarnings />} />
                      <Route path="settings" element={<VendorSettings />} />
                      <Route path="analytics" element={<VendorAnalytics />} />
                      <Route path="shipping" element={<VendorShipping />} />
                      <Route path="withdrawals" element={<Navigate to="withdrawals/request" replace />} />
                      <Route path="withdrawals/history" element={<VendorWithdrawalsHistory />} />
                      <Route path="withdrawals/request" element={<VendorWithdrawalsRequest />} />
                    </Route>
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    <Route path="/admin/dashboard" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    <Route path="/admin/orders" element={
                      <AdminRoute>
                        <AdminOrders />
                      </AdminRoute>
                    } />
                    <Route path="/admin/orders/:orderId" element={
                      <AdminRoute>
                        <AdminOrderDetail />
                      </AdminRoute>
                    } />
                    <Route path="/admin/products" element={
                      <AdminRoute>
                        <AdminProducts />
                      </AdminRoute>
                    } />
                    <Route path="/admin/products/add" element={
                      <AdminRoute>
                        <AdminAddProduct />
                      </AdminRoute>
                    } />
                    <Route path="/admin/product-approval" element={
                      <AdminRoute>
                        <ProductApproval />
                      </AdminRoute>
                    } />
                    <Route path="/admin/users" element={
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    } />
                    <Route path="/admin/users/add" element={
                      <AdminRoute>
                        <AddUser />
                      </AdminRoute>
                    } />
                    {/* <Route path="/admin/users/:id/edit" element={
                      <AdminRoute>
                        <EditUser />
                      </AdminRoute> */}
                    {/* } /> */}
                    <Route path="/admin/vendors" element={
                      <AdminRoute>
                        <VendorManagement />
                      </AdminRoute>
                    } />
                    <Route path="/admin/vendors/add" element={
                      <AdminRoute>
                        <AddVendor />
                      </AdminRoute>
                    } />
                    <Route path="/admin/vendor-requests" element={
                      <AdminRoute>
                        <VendorRequestManagement />
                      </AdminRoute>
                    } />
                    <Route path="/admin/auctions" element={
                      <AdminRoute>
                        <AuctionScheduler />
                      </AdminRoute>
                    } />
                    <Route path="/admin/auctions/active" element={
                      <AdminRoute>
                        <ActiveAuctions />
                      </AdminRoute>
                    } />
                    <Route path="/admin/auctions/:id" element={
                      <AdminRoute>
                        <AuctionDetail />
                      </AdminRoute>
                    } />
                    <Route path="/admin/coupons" element={
                      <AdminRoute>
                        <CouponManager />
                      </AdminRoute>
                    } />
                    <Route path="/admin/accounts" element={
                      <AdminRoute>
                        <AccountsManagement />
                      </AdminRoute>
                    } />
                    <Route path="/admin/features/add" element={
                      <AdminRoute>
                        <AddFeature />
                      </AdminRoute>
                    } />
                    <Route path="/admin/products/auction/add" element={
                      <AdminRoute>
                        <AddAuctionProduct />
                      </AdminRoute>
                    } />

                    {/* Vendor Product Routes moved under /vendor layout */}
                    <Route path="*" element={<ErrorPage />} />
                  </Routes>
                  {/* Catch-all route to redirect unknown URLs to Error page */}
                  {/* <Routes>
                    <Route path="*" element={<ErrorPage />} />
                  </Routes> */}
                </main>
                <Footer />
                
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
              </div>
            </Router>
            </AdminDataProvider>
          </NotificationProvider>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
