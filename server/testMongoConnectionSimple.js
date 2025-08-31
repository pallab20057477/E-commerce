const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart');
    
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000
    };
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart', options);
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Ready State:', mongoose.connection.readyState);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.length);
    
    await mongoose.connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure MongoDB is running on localhost:27017');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Check your MongoDB connection string in .env file');
    }
  }
}

testMongoConnection();
