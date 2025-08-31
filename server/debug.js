const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('=== STARTING DEBUG ===');
    
    // Test database connection
    console.log('Testing MongoDB connection...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB connected successfully');
    
    // Test creating a simple HTTP server
    console.log('\nTesting HTTP server...');
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.end('Test server is working!');
    });
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Test server is running on http://localhost:${PORT}`);
      console.log('\n=== DEBUG COMPLETE ===');
      console.log('The basic server is working. The issue might be in the application code.');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('\n❌ DEBUG ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  MongoDB connection was refused. Please make sure MongoDB is running.');
    }
    process.exit(1);
  }
}

testConnection();
