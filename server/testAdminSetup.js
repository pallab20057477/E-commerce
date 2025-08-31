const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

async function testAdminSetup() {
  try {
    console.log('🔧 Testing Admin Setup...');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart', {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if admin users exist
    const admins = await User.find({ role: 'admin' });
    console.log(`\nFound ${admins.length} admin users in database`);

    if (admins.length === 0) {
      console.log('❌ No admin users found. Please run the server to create admin users automatically.');
      return;
    }

    // Test each admin user
    for (const admin of admins) {
      console.log('\n' + '='.repeat(60));
      console.log(`🧪 Testing Admin: ${admin.name || 'No name'} (${admin.email})`);
      console.log('='.repeat(60));
      
      console.log(`📋 Status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`✅ Verified: ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`🔐 Password Hash: ${admin.password.substring(0, 20)}...`);
      
      // Test if password is properly hashed (not plaintext)
      const isHashed = admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$') || admin.password.startsWith('$2y$');
      console.log(`🔒 Password Encryption: ${isHashed ? '✅ Properly Hashed' : '❌ PLAINTEXT - SECURITY RISK!'}`);
      
      if (!isHashed) {
        console.log('🚨 SECURITY ALERT: Password is stored in plaintext!');
        console.log('🚨 Please check your User model pre-save middleware.');
      }
      
      // Test password verification with common test passwords
      console.log('\n🔑 Testing password verification...');
      const testPasswords = ['admin123', 'password', 'admin', '123456', 'ChangeMe123!'];
      let foundMatch = false;
      
      for (const password of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(password, admin.password);
          if (isMatch) {
            console.log(`✅ Password verified: '${password}'`);
            foundMatch = true;
            break;
          }
        } catch (error) {
          console.error(`❌ Error checking password: ${error.message}`);
        }
      }
      
      if (!foundMatch) {
        console.log('❌ No matching password found with common test passwords');
        console.log('💡 You may need to reset the password or check the actual password');
      }
    }

    console.log('\n🎉 Admin setup test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Check that all admin passwords are properly hashed');
    console.log('2. ✅ Verify admin accounts are active and verified');
    console.log('3. ✅ Test login functionality at http://localhost:3000/login');
    console.log('4. ✅ Change default passwords after first login');
    
  } catch (error) {
    console.error('\n❌ Error during admin setup test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure MongoDB is running on localhost:27017');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Check your MongoDB connection string in .env file');
    }
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAdminSetup();
}

module.exports = { testAdminSetup };
