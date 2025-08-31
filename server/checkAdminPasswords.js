const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

async function checkAdminPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    
    if (admins.length === 0) {
      console.log('No admin users found in the database');
      return;
    }

    console.log(`\nFound ${admins.length} admin users:`);
    
    // Check each admin user
    for (const admin of admins) {
      console.log('\n' + '='.repeat(50));
      console.log(`Admin: ${admin.name} (${admin.email})`);
      console.log('='.repeat(50));
      
      // Check if password exists and is hashed
      if (!admin.password) {
        console.log('❌ No password set for this admin');
        continue;
      }
      
      // Check if password is hashed (starts with $2b$)
      const isHashed = admin.password.startsWith('$2b$');
      console.log(`Password is ${isHashed ? 'hashed' : 'NOT hashed (this is a problem)'}`);
      
      // If not hashed, hash it
      if (!isHashed) {
        console.log('⚠️  Password is not hashed. Hashing it now...');
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
        await admin.save();
        console.log('✅ Password has been hashed and saved');
      }
      
      // Test password verification
      const testPassword = 'Pallab@2005'; // The password you're trying to use
      const isMatch = await bcrypt.compare(testPassword, admin.password);
      console.log(`Password '${testPassword}' is ${isMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      // Show user status
      console.log(`Account status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`Email verified: ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

// Run the function
checkAdminPasswords();
