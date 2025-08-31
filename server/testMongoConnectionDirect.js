const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoConnection() {
  console.log('=== Testing MongoDB Connection ===');
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
  const maskedUri = mongoUri.replace(/:[^:]*@/, ':***@');
  console.log('Connecting to:', maskedUri);
  
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // List all databases
    console.log('\n=== Listing Databases ===');
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    
    result.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk ? 'size: ' + db.sizeOnDisk + ' bytes' : 'size unknown'})`);
    });
    
    // Try to access the bidcart database
    try {
      const db = client.db('bidcart');
      const collections = await db.listCollections().toArray();
      
      console.log('\n=== Collections in bidcart database ===');
      if (collections.length === 0) {
        console.log('No collections found in bidcart database');
      } else {
        collections.forEach(coll => {
          console.log(`- ${coll.name}`);
        });
      }
    } catch (dbError) {
      console.error('\n❌ Error accessing bidcart database:', dbError.message);
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
    } else if (error.code === 'MongoServerSelectionError') {
      console.error('\n⚠️  Could not connect to MongoDB server. Check if MongoDB is running and accessible.');
    }
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

testMongoConnection();
