import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [currentRole, setCurrentRole] = useState('user'); // 'user', 'vendor', or 'admin'
  const [loading, setLoading] = useState(true);
  const [isVendorApproved, setIsVendorApproved] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);

          // ✅ Check admin first
          if (userData.role === 'admin') {
            setCurrentRole('admin');
          } else {
            // ✅ Then check vendor
            const vendorResponse = await api.get('/auth/vendor-status');
            if (vendorResponse.data.success && vendorResponse.data.vendor) {
              setVendor(vendorResponse.data.vendor);
              const isApproved = vendorResponse.data.vendor.status === 'approved';
              setIsVendorApproved(isApproved);
              setCurrentRole(isApproved ? 'vendor' : 'user');
            } else {
              setCurrentRole('user');
            }
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedRole = role.trim();
      const response = await api.post('/auth/login', { email: normalizedEmail, password, role: normalizedRole });
      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);

        // ✅ Admin role check
        if (userData.role === 'admin') {
          setCurrentRole('admin');
          return { success: true };
        }

        // ✅ Vendor check
        const vendorResponse = await api.get('/auth/vendor-status');
        if (vendorResponse.data.success && vendorResponse.data.vendor) {
          setVendor(vendorResponse.data.vendor);
          const isApproved = vendorResponse.data.vendor.status === 'approved';
          setIsVendorApproved(isApproved);
          setCurrentRole(isApproved ? 'vendor' : 'user');
        } else {
          setCurrentRole('user');
        }

        return { success: true };
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        const { token, user: newUser } = response.data;
        localStorage.setItem('token', token);
        setUser(newUser);
        return { success: true };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setVendor(null);
    setCurrentRole('user');
    setIsVendorApproved(false);
  };

  const switchRole = (role) => {
    // Prevent role switch if vendor is approved
    if (isVendorApproved && currentRole === 'vendor') {
      setCurrentRole('vendor');
      return;
    }
    setCurrentRole(role);
  };

  const getCurrentUser = () => {
    return currentRole === 'vendor' ? vendor : user;
  };

  const getCurrentRole = () => currentRole;

  const canAccessVendor = () => isVendorApproved && vendor;

  const isAdmin = user && user.role === 'admin';
  const isVendor = isVendorApproved && currentRole === 'vendor';
  const isAuthenticated = !!user;

  const value = {
    user,
    vendor,
    currentRole,
    isVendorApproved,
    loading,
    login,
    register,
    logout,
    switchRole,
    getCurrentUser,
    getCurrentRole,
    canAccessVendor,
    checkAuthStatus,
    isAdmin,
    isVendor,
    isAuthenticated,
    token: localStorage.getItem('token'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
