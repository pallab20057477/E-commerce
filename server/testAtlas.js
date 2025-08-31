const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in .env file');
    return;
  }

  console.log('Testing MongoDB Atlas connection...');
  console.log('Connection string:', uri.replace(/:([^:]+)@/, ':***@')); // Hide password in logs
  
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    const db = client.db();
    console.log('\n=== Database Info ===');
    console.log('Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== Collections ===');
    console.log(collections.map(c => `- ${c.name}`).join('\n') || 'No collections found');
    
    // Check users collection
    if (collections.some(c => c.name === 'users')) {
      const users = db.collection('users');
      const userCount = await users.countDocuments();
      console.log(`\n=== Users Collection ===`);
      console.log(`Total users: ${userCount}`);
      
      // List admin users
      const admins = await users.find({ role: 'admin' }).toArray();
      console.log(`\n=== Admin Users (${admins.length}) ===`);
      admins.forEach((admin, i) => {
        console.log(`\n${i + 1}. ${admin.name || 'No name'} (${admin.email})`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Verified: ${admin.isVerified || false}`);
        console.log(`   Created: ${admin.createdAt || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify your MongoDB Atlas IP whitelist includes your current IP');
    console.log('3. Check if your database user has the correct permissions');
    console.log('4. Verify your connection string in the .env file');
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

testConnection();
