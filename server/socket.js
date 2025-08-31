const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const setupSocket = (httpServer, options = {}) => {
  const io = new Server(httpServer, options);

  io.on('connection', (socket) => {
    console.log('=== Socket.IO Connection Established ===');
    console.log('Socket ID:', socket.id);

    // Try to join user to their own room for targeted events
    let userId = null;
    let userRole = null;
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      console.log('=== Socket Authentication ===');
      console.log('Token present:', !!token);
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Decoded token:', decoded);
        
        userId = decoded.userId || decoded.id || decoded._id;
        userRole = decoded.role;
        
        console.log('User ID:', userId);
        console.log('User Role:', userRole);
        
        if (userId) {
          socket.join(userId.toString());
          console.log(`Socket ${socket.id} joined user room: ${userId}`);
          
          if (userRole === 'admin') {
            socket.join('admins');
            console.log(`Socket ${socket.id} joined admins room`);
          }
          
          if (userRole === 'vendor') {
            socket.join('vendors');
            console.log(`Socket ${socket.id} joined vendors room`);
          }
        }
      } else {
        console.log('No token provided for socket authentication');
      }
    } catch (err) {
      console.error('=== Socket Authentication Error ===');
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      
      if (err.name !== 'TokenExpiredError' && err.name !== 'JsonWebTokenError') {
        console.log('Socket auth error:', err.message);
      }
    }

    // Join auction room
    socket.on('join-auction', (productId) => {
      socket.join(`auction-${productId}`);
      console.log(`Socket ${socket.id} joined auction room: auction-${productId}`);
    });

    // Leave auction room
    socket.on('leave-auction', (productId) => {
      socket.leave(`auction-${productId}`);
      console.log(`Socket ${socket.id} left auction room: auction-${productId}`);
    });

    // ===== USER EVENTS =====
    
    // User joins product tracking
    socket.on('track-product', (productId) => {
      socket.join(`product-${productId}`);
      console.log(`User ${userId} started tracking product: ${productId}`);
    });

    // User leaves product tracking
    socket.on('untrack-product', (productId) => {
      socket.leave(`product-${productId}`);
      console.log(`User ${userId} stopped tracking product: ${productId}`);
    });

    // User joins order tracking
    socket.on('track-order', (orderId) => {
      socket.join(`order-${orderId}`);
      console.log(`User ${userId} started tracking order: ${orderId}`);
    });

    // User leaves order tracking
    socket.on('untrack-order', (orderId) => {
      socket.leave(`order-${orderId}`);
      console.log(`User ${userId} stopped tracking order: ${orderId}`);
    });

    // User joins category for new product notifications
    socket.on('join-category', (category) => {
      socket.join(`category-${category}`);
      console.log(`User ${userId} joined category: ${category}`);
    });

    // User leaves category
    socket.on('leave-category', (category) => {
      socket.leave(`category-${category}`);
      console.log(`User ${userId} left category: ${category}`);
    });

    // ===== VENDOR EVENTS =====
    
    // Vendor joins product management room
    socket.on('join-vendor-product', (productId) => {
      socket.join(`vendor-product-${productId}`);
      console.log(`Vendor ${userId} joined product management: ${productId}`);
    });

    // Vendor leaves product management room
    socket.on('leave-vendor-product', (productId) => {
      socket.leave(`vendor-product-${productId}`);
      console.log(`Vendor ${userId} left product management: ${productId}`);
    });

    // Vendor joins order management room
    socket.on('join-vendor-order', (orderId) => {
      socket.join(`vendor-order-${orderId}`);
      console.log(`Vendor ${userId} joined order management: ${orderId}`);
    });

    // Vendor leaves order management room
    socket.on('leave-vendor-order', (orderId) => {
      socket.leave(`vendor-order-${orderId}`);
      console.log(`Vendor ${userId} left order management: ${orderId}`);
    });

    // Vendor joins earnings tracking
    socket.on('join-vendor-earnings', () => {
      socket.join(`vendor-earnings-${userId}`);
      console.log(`Vendor ${userId} joined earnings tracking`);
    });

    // Vendor leaves earnings tracking
    socket.on('leave-vendor-earnings', () => {
      socket.leave(`vendor-earnings-${userId}`);
      console.log(`Vendor ${userId} left earnings tracking`);
    });

    // ===== ADMIN EVENTS =====
    
    // Admin joins system monitoring
    socket.on('join-system-monitoring', () => {
      socket.join('system-monitoring');
      console.log(`Admin ${userId} joined system monitoring`);
    });

    // Admin leaves system monitoring
    socket.on('leave-system-monitoring', () => {
      socket.leave('system-monitoring');
      console.log(`Admin ${userId} left system monitoring`);
    });

    // Admin joins vendor management
    socket.on('join-vendor-management', (vendorId) => {
      socket.join(`admin-vendor-${vendorId}`);
      console.log(`Admin ${userId} joined vendor management: ${vendorId}`);
    });

    // Admin leaves vendor management
    socket.on('leave-vendor-management', (vendorId) => {
      socket.leave(`admin-vendor-${vendorId}`);
      console.log(`Admin ${userId} left vendor management: ${vendorId}`);
    });

    // Admin joins order monitoring
    socket.on('join-order-monitoring', (orderId) => {
      socket.join(`admin-order-${orderId}`);
      console.log(`Admin ${userId} joined order monitoring: ${orderId}`);
    });

    // Admin leaves order monitoring
    socket.on('leave-order-monitoring', (orderId) => {
      socket.leave(`admin-order-${orderId}`);
      console.log(`Admin ${userId} left order monitoring: ${orderId}`);
    });

    // ===== CHAT & SUPPORT EVENTS =====
    
    // User joins support chat
    socket.on('join-support-chat', () => {
      socket.join(`support-${userId}`);
      console.log(`User ${userId} joined support chat`);
    });

    // User leaves support chat
    socket.on('leave-support-chat', () => {
      socket.leave(`support-${userId}`);
      console.log(`User ${userId} left support chat`);
    });

    // Admin joins support chat
    socket.on('join-admin-support', () => {
      socket.join('admin-support');
      console.log(`Admin ${userId} joined admin support`);
    });

    // Admin leaves support chat
    socket.on('leave-admin-support', () => {
      socket.leave('admin-support');
      console.log(`Admin ${userId} left admin support`);
    });

    // ===== ANALYTICS EVENTS =====
    
    // Admin joins analytics room
    socket.on('join-analytics', () => {
      socket.join('analytics');
      console.log(`Admin ${userId} joined analytics room`);
    });

    // Admin leaves analytics room
    socket.on('leave-analytics', () => {
      socket.leave('analytics');
      console.log(`Admin ${userId} left analytics room`);
    });

    // Vendor joins analytics room
    socket.on('join-vendor-analytics', () => {
      socket.join(`vendor-analytics-${userId}`);
      console.log(`Vendor ${userId} joined analytics room`);
    });

    // Vendor leaves analytics room
    socket.on('leave-vendor-analytics', () => {
      socket.leave(`vendor-analytics-${userId}`);
      console.log(`Vendor ${userId} left analytics room`);
    });

    // Test connection event
    socket.on('test-connection', (data) => {
      console.log('=== Test Connection Received ===');
      console.log('From user:', userId);
      console.log('User role:', userRole);
      console.log('Data:', data);
      
      // Send back a test response
      socket.emit('test-response', {
        message: 'Connection test successful',
        userId: userId,
        userRole: userRole,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      console.log('User ID:', userId, 'Role:', userRole);
    });
  });

  return io;
};

module.exports = setupSocket; 