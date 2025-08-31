const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function listAdmins() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';
    console.log('Attempting to connect to MongoDB with URI:', mongoUri);
    
    // Connect to MongoDB with more detailed options
    const connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Successfully connected to MongoDB');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    console.log('MongoDB Host:', mongoose.connection.host);
    console.log('MongoDB Database:', mongoose.connection.name);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== DATABASE COLLECTIONS ===');
    console.log(collections.map(c => c.name).join(', '));

    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('name email role isVerified createdAt');
    
    console.log('\n=== ADMIN USERS ===');
    if (admins.length === 0) {
      console.log('No admin users found');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. ${admin.name} (${admin.email})`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Verified: ${admin.isVerified}`);
        console.log(`   Created: ${admin.createdAt}`);
      });
    }
    
    // Also list all users for reference
    const allUsers = await User.find({}).select('name email role isVerified');
    console.log('\n=== ALL USERS ===');
    console.table(allUsers.map(u => ({
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Verified: u.isVerified
    })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAdmins();
