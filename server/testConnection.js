const mongoose = require('mongoose');
require('dotenv').config();

async function testMongooseConnection() {
  console.log('=== Testing Mongoose Connection ===');
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
  const maskedUri = mongoUri.replace(/:([^:]*?)@/, ':***@');
  console.log('MongoDB URI:', maskedUri);
  
  // Set mongoose debug mode
  mongoose.set('debug', true);
  
  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  };
  
  try {
    // Attempt to connect
    console.log('\nAttempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, options);
    
    console.log('✅ Successfully connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    
    // Test a simple operation
    console.log('\nTesting database operation...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    console.log(collections.map(c => `- ${c.name}`).join('\n') || 'No collections found');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\nThis usually means:');
      console.error('1. MongoDB is not running');
      console.error('2. The connection string is incorrect');
      console.error('3. There are network connectivity issues');
      console.error('4. The MongoDB server is not accessible from this network');
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
    process.exit(0);
  }
}

testMongooseConnection();
