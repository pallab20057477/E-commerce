const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
    
    console.log('\n=== MONGODB CONNECTION ===');
    console.log('Connecting to MongoDB...');
    
    // Enable debug mode for development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
    
    // Clear any existing connection
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing database connection');
      return mongoose.connection;
    }
    
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 10000, // 10 seconds socket timeout
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };
    
    // Set up event listeners before connecting
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      console.log(`Database: ${mongoose.connection.name}`);
      console.log(`Host: ${mongoose.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('ℹ️  MongoDB disconnected');
    });
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    const connection = await mongoose.connect(mongoUri, options);
    
    // Verify the connection is ready
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB connection verified');
    } else {
      console.log('Waiting for MongoDB connection...');
      await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }
    
    return connection;
    
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    if (error.code === 'MONGODB_DUPLICATED_CONFIG_OPTION') {
      console.error('\n⚠️  Duplicate MongoDB configuration detected');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Could not resolve MongoDB hostname. Check your network connection and MONGODB_URI');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection to MongoDB was refused. Is MongoDB running?');
    } else if (error.code === 'MONGODB_URI_MISSING') {
      console.error('\n⚠️  MONGODB_URI is not defined in your .env file');
    }
    
    console.error('\n💡 TIP: Make sure your MongoDB server is running and the connection string is correct');
    process.exit(1);
  }
};

module.exports = connectDB;