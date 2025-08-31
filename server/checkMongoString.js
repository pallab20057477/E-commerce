require('dotenv').config();

// Get the connection string from environment variables
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI is not set in the .env file');
  process.exit(1);
}

// Basic validation of the connection string
console.log('Checking MongoDB connection string...');
console.log('Connection string:', mongoUri.replace(/:([^:]+)@/, ':***@'));

// Check if it's a valid MongoDB connection string
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.error('❌ Invalid MongoDB connection string format');
  console.log('Connection string should start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

// Check if it contains the database name
const dbNameMatch = mongoUri.match(/\/([^/?]+)/);
if (!dbNameMatch) {
  console.error('❌ Database name not found in the connection string');
  console.log('Example format: mongodb+srv://username:password@cluster.mongodb.net/databaseName');
  process.exit(1);
}

console.log('✅ Connection string format is valid');
console.log('Database name:', dbNameMatch[1]);

// Test the connection
console.log('\nTesting connection (this may take a few seconds)...');

const { MongoClient } = require('mongodb');
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

client.connect()
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    return client.db().admin().listDatabases();
  })
  .then(dbs => {
    console.log('\n=== Available Databases ===');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    return client.db(dbNameMatch[1]).listCollections().toArray();
  })
  .then(collections => {
    console.log('\n=== Collections ===');
    if (collections.length === 0) {
      console.log('No collections found in this database');
    } else {
      collections.forEach((col, i) => {
        console.log(`${i + 1}. ${col.name}`);
      });
    }
  })
  .catch(err => {
    console.error('\n❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    
    if (err.code === 'ENOTFOUND') {
      console.log('\nDNS lookup failed. Check your internet connection.');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('\nConnection refused. The server might be down or the connection string is incorrect.');
    } else if (err.code === 'ETIMEOUT') {
      console.log('\nConnection timeout. Check if your IP is whitelisted in MongoDB Atlas.');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Click on Network Access');
      console.log('3. Add your current IP address to the whitelist');
    } else if (err.message.includes('bad auth')) {
      console.log('\nAuthentication failed. Check your username and password in the connection string.');
    }
  })
  .finally(() => {
    client.close();
    console.log('\nConnection closed');
  });
