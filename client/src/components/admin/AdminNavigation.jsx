import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaChartLine, 
  FaBox, 
  FaUsers, 
  FaStore, 
  FaGavel, 
  FaTicketAlt, 
  FaCoins,
  FaCog,
  FaClipboardList,
  FaCheckCircle,
  FaShoppingCart,
  FaPlus,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';

const AdminNavigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      path: '/admin',
      icon: <FaChartLine />,
      label: 'Dashboard',
      description: 'Analytics & Overview'
    },
    {
      path: '/admin/orders',
      icon: <FaShoppingCart />,
      label: 'Orders',
      description: 'Order Management'
    },
    {
      path: '/admin/products',
      icon: <FaBox />,
      label: 'Products',
      description: 'Manage Products'
    },
    {
      path: '/admin/product-approval',
      icon: <FaCheckCircle />,
      label: 'Product Approval',
      description: 'Review Pending Products'
    },
    {
      path: '/admin/users',
      icon: <FaUsers />,
      label: 'Users',
      description: 'User Management'
    },
    {
      path: '/admin/vendors',
      icon: <FaStore />,
      label: 'Vendors',
      description: 'Vendor Management'
    },
    {
      path: '/admin/vendor-requests',
      icon: <FaClipboardList />,
      label: 'Vendor Requests',
      description: 'Review Applications'
    },
    {
      path: '/admin/auctions',
      icon: <FaGavel />,
      label: 'Auctions',
      description: 'Auction Scheduler'
    },
    {
      path: '/admin/auctions/active',
      icon: <FaGavel />,
      label: 'Active Auctions',
      description: 'View Active Auctions'
    },
    {
      path: '/admin/coupons',
      icon: <FaTicketAlt />,
      label: 'Coupons',
      description: 'Discount Management'
    }
    
  ];

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-xl p-6 flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary-focus flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user?.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg text-white truncate">{user?.name || 'Admin'}</div>
          <div className="text-white/80 text-sm truncate">{user?.email || ''}</div>
          <div className="flex gap-2 mt-2">
            <Link to="/profile" className="btn btn-xs btn-outline btn-white text-white border-white hover:bg-white hover:text-primary transition">Profile</Link>
            <button onClick={logout} className="btn btn-xs btn-error text-white flex items-center gap-1"><FaSignOutAlt />Logout</button>
          </div>
        </div>
      </div>
      <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg text-base-content/70">
            Real-time analytics and insights for your e-commerce platform
          </p><br></br>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg transition-all duration-300 border-2
                ${location.pathname.startsWith(item.path)
                  ? 'bg-gradient-to-br from-primary to-secondary text-white border-primary scale-105'
                  : 'bg-white hover:bg-gradient-to-br hover:from-primary hover:to-secondary hover:text-white border-base-200'}
              `}
              aria-current={location.pathname.startsWith(item.path) ? 'page' : undefined}
            >
              <span className={`text-3xl mb-3 transition-colors duration-200 ${location.pathname.startsWith(item.path) ? 'text-white' : 'text-primary group-hover:text-white'}`}>{item.icon}</span>
              <span className="font-bold text-lg mb-1 text-center">{item.label}</span>
              <span className="text-xs text-center opacity-70">{item.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation; 