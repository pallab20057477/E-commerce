const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB');

    const db = client.db();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== COLLECTIONS ===');
    console.log(collections.map(c => c.name).join('\n'));
    
    // Check if users collection exists
    if (collections.some(c => c.name === 'users')) {
      console.log('\n=== USERS ===');
      const users = await db.collection('users').find({}).toArray();
      console.log(users);
      
      console.log('\n=== ADMIN USERS ===');
      const admins = await db.collection('users').find({ role: 'admin' }).toArray();
      console.log(admins);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
