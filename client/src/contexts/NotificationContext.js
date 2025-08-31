import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleNewNotification = (data) => {
      fetchNotifications();
      toast(data.message, { icon: '🔔' });
    };
    const handleOrderStatus = (data) => {
      fetchNotifications();
      toast(`Order #${data.orderId ? data.orderId.slice(-6) : ''} status updated to ${data.status}`, { icon: '📦' });
    };
    const handlePaymentStatus = (data) => {
      fetchNotifications();
      toast(`Payment status: ${data.paymentStatus}`, { icon: '💳' });
    };
    socket.on('notification:new', handleNewNotification);
    socket.on('order:status', handleOrderStatus);
    socket.on('payment:status', handlePaymentStatus);
    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('order:status', handleOrderStatus);
      socket.off('payment:status', handlePaymentStatus);
    };
  }, [socket, user, fetchNotifications]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {}
  };

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch (error) {}
  };

  // Get unread count
  const getUnreadCount = () => notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    loading,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 