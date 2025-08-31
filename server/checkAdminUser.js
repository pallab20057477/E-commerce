require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function checkAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./models/User');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' }).select('+password');
    
    if (!admin) {
      console.log('❌ No admin user found in the database');
      return;
    }

    console.log('\n=== ADMIN USER FOUND ===');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Active: ${admin.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`Verified: ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`Password hash: ${admin.password.substring(0, 10)}...`);

    // Test password
    const testPassword = 'Pallab@2005';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    console.log('\n=== PASSWORD TEST ===');
    console.log(`Testing password: ${testPassword}`);
    console.log(`Password match: ${isMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);

    if (!isMatch) {
      console.log('\n⚠️  The password is incorrect. Here are some things to check:');
      console.log('1. Make sure the password matches exactly (case-sensitive)');
      console.log('2. Check for any extra spaces in the password');
      console.log('3. The password might have been changed - check the database');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

// Run the check
checkAdminUser();
