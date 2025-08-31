const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('=== Testing MongoDB Connection ===');
  
  try {
    // Show the MongoDB URI (masking password for security)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
    const maskedUri = mongoUri.replace(/:[^:]*@/, ':***@');
    console.log('Connecting to:', maskedUri);
    
    // Set connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, options);
    console.log('✅ Successfully connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== Collections ===');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    // Check if users collection exists
    const hasUsers = collections.some(coll => coll.name === 'users');
    console.log('\n=== Users Collection ===');
    console.log(hasUsers ? '✅ Found users collection' : '❌ Users collection not found');
    
    if (hasUsers) {
      const User = require('./models/User');
      const adminCount = await User.countDocuments({ role: 'admin' });
      console.log(`\nFound ${adminCount} admin user(s) in the database`);
      
      if (adminCount > 0) {
        const admin = await User.findOne({ role: 'admin' }).select('+password');
        console.log('\n=== First Admin User ===');
        console.log(`Name: ${admin.name}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Active: ${admin.isActive}`);
        console.log(`Verified: ${admin.isVerified}`);
        console.log(`Password hash: ${admin.password ? 'Set' : 'Not set'}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Could not resolve the hostname. Check your internet connection.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused. Is MongoDB running?');
    } else if (error.code === 'MONGODB_URI_MISSING') {
      console.error('\n⚠️  MONGODB_URI is not defined in your .env file');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n✅ Connection closed');
    }
    process.exit(0);
  }
}

testConnection();
