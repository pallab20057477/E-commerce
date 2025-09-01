const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const setupSocket = require('./socket'); // <-- import the new socket module
const DashboardCache = require('./utils/dashboardCache');
const path = require('path');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const bidRoutes = require('./routes/bids');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const vendorRoutes = require('./routes/vendors');
const couponRoutes = require('./routes/coupons');
const deliveryRoutes = require('./routes/delivery');
const dashboardRoutes = require('./routes/admin/dashboard');
const disputeRoutes = require('./routes/disputes');
const vendorRequestRoutes = require('./routes/vendorRequests');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const featuresRoutes = require('./routes/features');
const reviewRoutes = require('./routes/reviews');
const Product = require('./models/Product');
const User = require('./models/User');
const jwt = require('jsonwebtoken'); // Add this at the top for token decoding
const connectDB = require('./config/db');
const cloudinary = require('./config/cloudinary');
const ErrorHandler = require('./middleware/errorHandler');

// Initialize dashboard cache
global.dashboardCache = new DashboardCache();

const app = express();
const server = http.createServer(app);
const io = setupSocket(server, {
  cors: {
    origin: [
      'https://bidcart-v32j.onrender.com',
      'http://localhost:3000',
      process.env.CLIENT_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});
app.set('io', io);

// CORS Configuration
const allowedOrigins = [
  'https://bidcart-v32j.onrender.com',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

// Configure CORS with specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400 // 24 hours
};

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
// Add manual CORS headers as a fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', true);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for dispute evidence
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/vendor-requests', vendorRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', uploadRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/reviews', reviewRoutes);
app.get('/api/test-root', (req, res) => {
  console.log('Test root route hit');
  res.json({ message: 'Test root route hit' });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== ERROR STACK TRACE ===');
  console.error(err.stack);
  
  // Log request details
  console.error('\n=== REQUEST DETAILS ===');
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Headers:', req.headers);
  console.error('Body:', req.body);
  
  // Log environment info
  console.error('\n=== ENVIRONMENT ===');
  console.error('Node Version:', process.version);
  console.error('NODE_ENV:', process.env.NODE_ENV);
  
  // Log database connection status
  console.error('\n=== DATABASE STATUS ===');
  console.error('MongoDB Connected:', mongoose.connection.readyState === 1 ? '✅ Yes' : '❌ No');
  
  // Send detailed error in development, generic in production
  const errorResponse = {
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
      ...err
    } : undefined
  };
  
  res.status(500).json(errorResponse);
});

// 404 handler (after all routes)
app.use(ErrorHandler.handleNotFound);

// Global error handler (must be last)
app.use(ErrorHandler.handleError);

// Import createAdmin function
const createAdmin = require('./createAdmin');

// Clean server startup sequence
const startServer = async () => {
  try {
    console.log('=== STARTING SERVER ===');
    
    // 1. Connect to MongoDB
    console.log('[1/4] Connecting to MongoDB...');
    try {
      await connectDB();
      console.log('✅ MongoDB connected successfully');
    } catch (dbError) {
      console.error('❌ Failed to connect to MongoDB:', dbError.message);
      throw dbError;
    }
    
    // 2. Start the HTTP server first
    const PORT = process.env.PORT || 5000;
    console.log(`[2/4] Starting HTTP server on port ${PORT}...`);
    
    await new Promise((resolve, reject) => {
      server.listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
        console.log('\n=== BACKEND SERVER STARTED SUCCESSFULLY ===');
        console.log('===', new Date().toISOString(), '===');
        resolve();
      }).on('error', (err) => {
        console.error('❌ Failed to start HTTP server:', err.message);
        reject(err);
      });
    });
    
    // 3. Initialize admin users (non-blocking)
    console.log('[3/4] Initializing admin users...');
    createAdmin.createAdminUser()
      .then(() => console.log('✅ Admin users initialized'))
      .catch(err => console.warn('⚠️  Admin init warning:', err.message));
    
    // 4. Start auction scheduler (non-blocking)
    console.log('[4/4] Initializing auction scheduler...');
    try {
      const auctionScheduler = require('./utils/auctionScheduler');
      auctionScheduler.setIo(io);
      
      if (mongoose.connection.readyState === 1) {
        auctionScheduler.start();
        console.log('✅ Auction scheduler started');
      } else {
        mongoose.connection.once('connected', () => {
          auctionScheduler.start();
          console.log('✅ Auction scheduler started (delayed)');
        });
      }
    } catch (err) {
      console.warn('⚠️  Auction scheduler failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();