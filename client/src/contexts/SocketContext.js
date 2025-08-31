import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  // Listener arrays for order and delivery updates
  const orderStatusListeners = React.useRef([]);
  const deliveryUpdateListeners = React.useRef([]);
  const paymentStatusListeners = React.useRef([]);

  useEffect(() => {
    if (user) {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.log('=== No token available for Socket.IO connection ===');
        return;
      }

      console.log('=== Attempting Socket.IO Connection ===');
      console.log('User:', user.name);
      console.log('User Role:', user.role);
      console.log('Token present:', !!currentToken);
      
      const newSocket = io('http://localhost:5000', {
        auth: { token: currentToken }
      });

      newSocket.on('connect', () => {
        console.log('=== Socket.IO Connected Successfully ===');
        console.log('Socket ID:', newSocket.id);
        console.log('User Role:', user.role);
        setConnected(true);
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('=== Socket.IO Disconnected ===');
        console.log('Disconnect reason:', reason);
        setConnected(false);
        
        // Attempt to reconnect if it's not a manual disconnect
        if (reason !== 'io client disconnect') {
          console.log('Attempting to reconnect...');
          setTimeout(() => {
            if (user) {
              const currentToken = localStorage.getItem('token');
              if (currentToken) {
                console.log('Reconnecting Socket.IO...');
                newSocket.connect();
              }
            }
          }, 3000); // Wait 3 seconds before reconnecting
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('=== Socket.IO Connection Error ===', error);
        console.error('Error details:', error.message);
        setConnected(false);
      });

      // Notifications
      newSocket.on('notification:new', (data) => {
        toast(data.message, { icon: '🔔' });
      });

      // Delivery updates
      newSocket.on('delivery:update', (data) => {
        toast(`Delivery update: ${data.status}`, { icon: '🚚' });
        deliveryUpdateListeners.current.forEach(fn => fn(data));
      });

      // Order status updates
      newSocket.on('order:status', (data) => {
        toast(`Order status: ${data.status}`, { icon: '📦' });
        orderStatusListeners.current.forEach(fn => fn(data));
      });

      // Payment status updates
      newSocket.on('payment:status', (data) => {
        toast(`Payment status: ${data.paymentStatus}`, { icon: '💳' });
        paymentStatusListeners.current.forEach(fn => fn(data));
      });

      // Auction events (existing)
      newSocket.on('bid-update', (data) => {
        toast.success(`New bid: $${data.currentBid} by ${data.bidder}`, {
          duration: 3000,
          icon: '💰'
        });
      });
      newSocket.on('auction-ended', (data) => {
        toast.success(`Auction ended! Winner: ${data.winner}`, {
          duration: 5000,
          icon: '🏆'
        });
      });

      // Vendor events
      newSocket.on('vendor:new-order', (data) => {
        toast.success(`New order received! Order #${data.orderNumber}`, {
          duration: 4000,
          icon: '📦'
        });
      });

      newSocket.on('vendor:order-update', (data) => {
        toast.success(`Order #${data.orderNumber} status updated to ${data.status}`, {
          duration: 4000,
          icon: '🔄'
        });
      });

      newSocket.on('vendor:product-approved', (data) => {
        toast.success(`Product "${data.productName}" has been approved!`, {
          duration: 5000,
          icon: '✅'
        });
      });

      newSocket.on('vendor:product-rejected', (data) => {
        toast.error(`Product "${data.productName}" was rejected: ${data.reason}`, {
          duration: 6000,
          icon: '❌'
        });
      });

      newSocket.on('vendor:stock-alert', (data) => {
        toast.warning(`Low stock alert: ${data.productName} (${data.stock} remaining)`, {
          duration: 5000,
          icon: '⚠️'
        });
      });

      newSocket.on('vendor:withdrawal-submitted', (data) => {
        toast.success(`Withdrawal request submitted for $${data.amount}`, {
          duration: 4000,
          icon: '💰'
        });
      });

      // Admin vendor withdrawal notifications
      newSocket.on('vendor:withdrawal-request', (data) => {
        if (user?.role === 'admin') {
          toast.success(`New withdrawal request from ${data.vendorName} for $${data.amount}`, {
            duration: 5000,
            icon: '🏦'
          });
        }
      });

      newSocket.on('vendor:earnings-update', (data) => {
        toast.success(`Earnings updated: +$${data.netEarnings} (Commission: $${data.commission})`, {
          duration: 4000,
          icon: '💵'
        });
      });

      // ===== USER EVENTS =====
      
      // New product notifications
      newSocket.on('product:new', (data) => {
        toast.success(`New product in ${data.category}: ${data.name}`, {
          duration: 4000,
          icon: '🆕'
        });
      });

      // Order creation confirmation
      newSocket.on('order:created', (data) => {
        toast.success(`Order #${data.orderNumber} created successfully!`, {
          duration: 5000,
          icon: '📦'
        });
      });

      // ===== ADMIN EVENTS =====
      
      // Dashboard updates
      newSocket.on('admin:dashboard-update', (data) => {
        if (user?.role === 'admin') {
          toast.success(`Dashboard updated: ${data.stats.totalOrders} orders, $${data.stats.totalRevenue} revenue`, {
            duration: 3000,
            icon: '📊'
          });
        }
      });

      // ===== VENDOR EVENTS =====
      
      // Dashboard updates
      newSocket.on('vendor:dashboard-update', (data) => {
        if (user?.role === 'vendor') {
          toast.success(`Dashboard updated: ${data.stats.totalProducts} products, $${data.stats.totalEarnings} earnings`, {
            duration: 3000,
            icon: '📈'
          });
        }
      });

      // Test response handler
      newSocket.on('test-response', (data) => {
        console.log('=== Test Response Received ===', data);
        toast.success('Socket.IO connection test successful!', {
          duration: 3000,
          icon: '✅'
        });
      });

      setSocket(newSocket);
      
      // Cleanup function
      return () => {
        console.log('=== Cleaning up Socket.IO connection ===');
        if (newSocket) {
          newSocket.close();
        }
      };
    }
  }, [user]);

  // Emitters for real-time actions
  const emitDeliveryUpdate = (orderId, status) => {
    if (socket && connected) {
      socket.emit('delivery:update', { orderId, status });
    }
  };

  const emitOrderStatus = (orderId, status, userId) => {
    if (socket && connected) {
      socket.emit('order:status', { orderId, status, userId });
    }
  };

  const emitPaymentStatus = (orderId, paymentStatus, userId) => {
    if (socket && connected) {
      socket.emit('payment:status', { orderId, paymentStatus, userId });
    }
  };

  const emitNotification = (userId, message) => {
    if (socket && connected) {
      socket.emit('notification:new', { userId, message });
    }
  };

  // Subscription API for order/delivery updates
  const subscribeOrderStatus = (fn) => {
    orderStatusListeners.current.push(fn);
    return () => {
      orderStatusListeners.current = orderStatusListeners.current.filter(f => f !== fn);
    };
  };
  const subscribeDeliveryUpdate = (fn) => {
    deliveryUpdateListeners.current.push(fn);
    return () => {
      deliveryUpdateListeners.current = deliveryUpdateListeners.current.filter(f => f !== fn);
    };
  };

  const subscribePaymentStatus = (fn) => {
    paymentStatusListeners.current.push(fn);
    return () => {
      paymentStatusListeners.current = paymentStatusListeners.current.filter(f => f !== fn);
    };
  };

  // ===== USER EVENTS =====
  
  // Product tracking
  const trackProduct = (productId) => {
    if (socket && connected) {
      socket.emit('track-product', productId);
    }
  };
  
  const untrackProduct = (productId) => {
    if (socket && connected) {
      socket.emit('untrack-product', productId);
    }
  };

  // Order tracking
  const trackOrder = (orderId) => {
    if (socket && connected) {
      socket.emit('track-order', orderId);
    }
  };

  const untrackOrder = (orderId) => {
    if (socket && connected) {
      socket.emit('untrack-order', orderId);
    }
  };

  // Category notifications
  const joinCategory = (category) => {
    if (socket && connected) {
      socket.emit('join-category', category);
    }
  };

  const leaveCategory = (category) => {
    if (socket && connected) {
      socket.emit('leave-category', category);
    }
  };

  // ===== VENDOR EVENTS =====
  
  // Product management
  const joinVendorProduct = (productId) => {
    if (socket && connected) {
      socket.emit('join-vendor-product', productId);
    }
  };

  const leaveVendorProduct = (productId) => {
    if (socket && connected) {
      socket.emit('leave-vendor-product', productId);
    }
  };

  // Order management
  const joinVendorOrder = (orderId) => {
    if (socket && connected) {
      socket.emit('join-vendor-order', orderId);
    }
  };

  const leaveVendorOrder = (orderId) => {
    if (socket && connected) {
      socket.emit('leave-vendor-order', orderId);
    }
  };

  // Earnings tracking
  const joinVendorEarnings = () => {
    if (socket && connected) {
      socket.emit('join-vendor-earnings');
    }
  };

  const leaveVendorEarnings = () => {
    if (socket && connected) {
      socket.emit('leave-vendor-earnings');
    }
  };

  // ===== ADMIN EVENTS =====
  
  // System monitoring
  const joinSystemMonitoring = () => {
    if (socket && connected) {
      socket.emit('join-system-monitoring');
    }
  };

  const leaveSystemMonitoring = () => {
    if (socket && connected) {
      socket.emit('leave-system-monitoring');
    }
  };

  // Vendor management
  const joinVendorManagement = (vendorId) => {
    if (socket && connected) {
      socket.emit('join-vendor-management', vendorId);
    }
  };

  const leaveVendorManagement = (vendorId) => {
    if (socket && connected) {
      socket.emit('leave-vendor-management', vendorId);
    }
  };

  // Order monitoring
  const joinOrderMonitoring = (orderId) => {
    if (socket && connected) {
      socket.emit('join-order-monitoring', orderId);
    }
  };

  const leaveOrderMonitoring = (orderId) => {
    if (socket && connected) {
      socket.emit('leave-order-monitoring', orderId);
    }
  };

  // ===== CHAT & SUPPORT EVENTS =====
  
  // Support chat
  const joinSupportChat = () => {
    if (socket && connected) {
      socket.emit('join-support-chat');
    }
  };

  const leaveSupportChat = () => {
    if (socket && connected) {
      socket.emit('leave-support-chat');
    }
  };

  const joinAdminSupport = () => {
    if (socket && connected) {
      socket.emit('join-admin-support');
    }
  };

  const leaveAdminSupport = () => {
    if (socket && connected) {
      socket.emit('leave-admin-support');
    }
  };

  // ===== ANALYTICS EVENTS =====
  
  const joinAnalytics = () => {
    if (socket && connected) {
      socket.emit('join-analytics');
    }
  };

  const leaveAnalytics = () => {
    if (socket && connected) {
      socket.emit('leave-analytics');
    }
  };

  const joinVendorAnalytics = () => {
    if (socket && connected) {
      socket.emit('join-vendor-analytics');
    }
  };

  const leaveVendorAnalytics = () => {
    if (socket && connected) {
      socket.emit('leave-vendor-analytics');
    }
  };

  // ===== AUCTION EVENTS =====
  
  // Auction room join/leave and bid emitters
  const joinAuction = (productId) => {
    if (socket && connected) {
      socket.emit('join-auction', productId);
    }
  };
  
  const leaveAuction = (productId) => {
    if (socket && connected) {
      socket.emit('leave-auction', productId);
    }
  };
  
  const placeBid = (productId, amount) => {
    if (socket && connected) {
      socket.emit('place-bid', { productId, amount, bidder: user?.name || 'Anonymous' });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket, connected,
      emitDeliveryUpdate, emitOrderStatus, emitPaymentStatus, emitNotification,
      subscribeOrderStatus, subscribeDeliveryUpdate, subscribePaymentStatus,
      
      // User events
      trackProduct, untrackProduct, trackOrder, untrackOrder,
      joinCategory, leaveCategory,
      
      // Vendor events
      joinVendorProduct, leaveVendorProduct, joinVendorOrder, leaveVendorOrder,
      joinVendorEarnings, leaveVendorEarnings,
      
      // Admin events
      joinSystemMonitoring, leaveSystemMonitoring,
      joinVendorManagement, leaveVendorManagement,
      joinOrderMonitoring, leaveOrderMonitoring,
      
      // Chat & Support events
      joinSupportChat, leaveSupportChat, joinAdminSupport, leaveAdminSupport,
      
      // Analytics events
      joinAnalytics, leaveAnalytics, joinVendorAnalytics, leaveVendorAnalytics,
      
      // Auction events
      joinAuction, leaveAuction, placeBid
    }}>
      {children}
    </SocketContext.Provider>
  );
}; 