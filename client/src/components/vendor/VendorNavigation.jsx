import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaChartLine,
  FaBox,
  FaShoppingCart,
  FaCoins,
  FaCog,
  FaPlus,
  FaUser,
  FaBell,
  FaChartBar,
  FaTruck,
  FaMoneyCheckAlt
} from 'react-icons/fa';

const VendorNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/vendor/dashboard',
      icon: <FaChartLine />,
      label: 'Dashboard',
      description: 'Overview & Analytics'
    },
    {
      path: '/vendor/products',
      icon: <FaBox />,
      label: 'Products',
      description: 'Manage Your Products'
    },
    {
      path: '/vendor/orders',
      icon: <FaShoppingCart />,
      label: 'Orders',
      description: 'Order Management'
    },
    {
      path: '/vendor/earnings',
      icon: <FaCoins />,
      label: 'Earnings',
      description: 'Sales & Payouts'
    },
    {
      path: '/vendor/withdrawals',
      icon: <FaMoneyCheckAlt />,
      label: 'Withdrawals',
      description: 'Withdrawals',
      subLinks: [
        { path: '/vendor/withdrawals/request', label: 'Request Withdrawal' },
        { path: '/vendor/withdrawals/history', label: 'History' },
      ]
    },
    {
      path: '/vendor/shipping',
      icon: <FaTruck />,
      label: 'Shipping',
      description: 'Shipping Methods'
    },
    {
      path: '/vendor/analytics',
      icon: <FaChartBar />,
      label: 'Analytics',
      description: 'Business Intelligence'
    },
    {
      path: '/vendor/settings',
      icon: <FaCog />,
      label: 'Settings',
      description: 'Profile & Preferences'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Navigation Menu */}
      <div className="bg-base-100 shadow-xl rounded-2xl" role="navigation" aria-label="Vendor navigation">
        <div className="p-6 border-b border-base-300">
          <h2 className="text-2xl font-bold flex items-center">
            <FaUser className="mr-3" />
            Vendor Dashboard
          </h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-4 rounded-lg transition-all duration-300 hover:bg-base-200 ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-primary text-primary-content shadow-lg'
                      : 'text-base-content'
                  }`}
                  aria-current={location.pathname.startsWith(item.path) ? 'page' : undefined}
                >
                  <span className="text-xl mr-4">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className={`text-sm ${location.pathname.startsWith(item.path) ? 'opacity-90' : 'opacity-70'}`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
                {item.subLinks && location.pathname.startsWith(item.path) && (
                  <ul className="ml-12 mt-2 space-y-1">
                    {item.subLinks.map((sub) => (
                      <li key={sub.path}>
                        <Link
                          to={sub.path}
                          className={`block px-3 py-2 rounded hover:bg-base-200 ${
                            location.pathname === sub.path ? 'text-primary font-medium' : 'text-base-content/80'
                          }`}
                          aria-current={location.pathname === sub.path ? 'page' : undefined}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default VendorNavigation;
