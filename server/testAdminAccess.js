const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAdminAccess() {
  try {
    console.log('Testing admin access...');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const User = require('./models/User');
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('\n=== Admin User Found ===');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Active: ${admin.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`Verified: ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
    
    // Test password
    const isPasswordCorrect = await bcrypt.compare('Pallab@2005', admin.password);
    console.log(`\nPassword 'Pallab@2005' is ${isPasswordCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (isPasswordCorrect) {
      // Generate JWT token
      const token = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );
      
      console.log('\n✅ Login successful!');
      console.log('\n=== JWT Token ===');
      console.log(token);
      console.log('\nUse this token in your frontend with the Authorization header:');
      console.log(`Authorization: Bearer ${token}`);
    } else {
      console.log('\n❌ Login failed: Incorrect password');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
  }
}

testAdminAccess();
