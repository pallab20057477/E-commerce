import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaStore, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const RoleSwitcher = () => {
  const { 
    user, 
    vendor, 
    currentRole, 
    isVendorApproved, 
    switchRole, 
    logout 
  } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleRoleSwitch = (role) => {
    try {
      switchRole(role);
      setShowDropdown(false);
      
      // Redirect based on role
      if (role === 'vendor') {
        window.location.href = '/vendor/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn btn-ghost btn-sm gap-2"
      >
        {currentRole === 'vendor' ? (
          <>
            <FaStore className="text-success" />
            <span className="hidden md:inline">Vendor</span>
          </>
        ) : (
          <>
            <FaUser />
            <span className="hidden md:inline">User</span>
          </>
        )}
        <FaChevronDown className="text-xs" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-base-100 shadow-xl rounded-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-base-content/60">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            {/* Current Role Display */}
            <div className="p-3 bg-base-200 rounded-lg mb-2">
              <p className="text-sm font-medium">Current Role:</p>
              <div className="flex items-center space-x-2 mt-1">
                {currentRole === 'vendor' ? (
                  <>
                    <FaStore className="text-success" />
                    <span className="text-success font-semibold">Vendor</span>
                  </>
                ) : (
                  <>
                    <FaUser />
                    <span className="font-semibold">Regular User</span>
                  </>
                )}
              </div>
            </div>

            {/* Role Switch Options */}
            {isVendorApproved && (
              <div className="space-y-1">
                {currentRole === 'user' && (
                  <button
                    onClick={() => handleRoleSwitch('vendor')}
                    className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center space-x-3 transition-colors"
                  >
                    <FaStore className="text-success" />
                    <div>
                      <p className="font-medium">Switch to Vendor</p>
                      <p className="text-sm text-base-content/60">
                        {vendor?.businessName || 'Manage your business'}
                      </p>
                    </div>
                  </button>
                )}

                {currentRole === 'vendor' && (
                  <button
                    onClick={() => handleRoleSwitch('user')}
                    className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center space-x-3 transition-colors"
                  >
                    <FaUser />
                    <div>
                      <p className="font-medium">Switch to User</p>
                      <p className="text-sm text-base-content/60">
                        Shop and browse products
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Quick Links */}
            <div className="border-t pt-2 mt-2">
              {currentRole === 'vendor' ? (
                <Link
                  to="/vendor/dashboard"
                  className="block p-3 hover:bg-base-200 rounded-lg transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <p className="font-medium">Vendor Dashboard</p>
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="block p-3 hover:bg-base-200 rounded-lg transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <p className="font-medium">User Profile</p>
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="border-t pt-2 mt-2">
              <button
                onClick={handleLogout}
                className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center space-x-3 transition-colors text-error"
              >
                <FaSignOutAlt />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher; 