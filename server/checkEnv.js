// Check environment variables
console.log('Checking environment variables...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

// Try to load .env file if it exists
try {
  require('dotenv').config({ path: __dirname + '/.env' });
  console.log('\nAfter loading .env file:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
} catch (error) {
  console.log('\nError loading .env file:', error.message);
}

// Check if we can connect to MongoDB
async function testMongoConnection() {
  if (!process.env.MONGODB_URI) {
    console.log('\n❌ Cannot test MongoDB connection: MONGODB_URI not set');
    return;
  }

  try {
    const mongoose = require('mongoose');
    console.log('\nAttempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    console.log(collections.map(c => `- ${c.name}`).join('\n') || 'No collections found');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    console.log('\nPlease check:');
    console.log('1. Your MongoDB Atlas connection string in .env file');
    console.log('2. Your internet connection');
    console.log('3. MongoDB Atlas IP whitelist settings');
  }
}

testMongoConnection();
