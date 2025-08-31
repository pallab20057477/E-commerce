const { MongoClient } = require('mongodb');

async function testLocalMongo() {
  console.log('=== Testing Local MongoDB Connection ===');
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('Attempting to connect to local MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to local MongoDB');
    
    // List all databases
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    
    console.log('\n=== Available Databases ===');
    result.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk ? 'size: ' + db.sizeOnDisk + ' bytes' : 'size unknown'})`);
    });
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n⚠️  Could not connect to MongoDB. Please check:');
      console.error('1. Is MongoDB installed and running?');
      console.error('2. Is the MongoDB service running? (Try: net start MongoDB)');
      console.error('3. Is there a firewall blocking port 27017?');
    }
  } finally {
    if (client) {
      await client.close();
      console.log('\nConnection closed');
    }
  }
}

testLocalMongo();
