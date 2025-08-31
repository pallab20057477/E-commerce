const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('Connection string:', process.env.MONGODB_URI ? 
    process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:*****@') : 
    'Not found');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    return;
  }

  try {
    // Set debug mode
    mongoose.set('debug', true);
    
    // Connect with options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    console.log('\nAttempting to connect with options:', options);
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Successfully connected to MongoDB!');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== Collections ===');
    console.log(collections.map(c => `- ${c.name}`).join('\n') || 'No collections found');
    
    // Check if users collection exists
    const hasUsers = collections.some(c => c.name === 'users');
    if (hasUsers) {
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`\nFound ${userCount} users in the database`);
      
      // List admin users
      const admins = await mongoose.connection.db.collection('users')
        .find({ role: 'admin' })
        .project({ email: 1, name: 1, role: 1, isVerified: 1, _id: 0 })
        .toArray();
      
      console.log('\n=== Admin Users ===');
      console.log(admins.length > 0 ? admins : 'No admin users found');
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    if (error.code === 'MONGODB_DUPLICATE_KEY') {
      console.log('\nDuplicate key error - This usually means a unique index was violated');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\nDNS lookup failed - Check your internet connection and MongoDB Atlas whitelist settings');
    } else if (error.code === 'ETIMEOUT') {
      console.log('\nConnection timeout - Check if your IP is whitelisted in MongoDB Atlas');
    }
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
  }
}

testConnection();
