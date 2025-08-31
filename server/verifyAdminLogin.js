const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function verifyAdminLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // Check if users collection exists
    const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('❌ Users collection does not exist');
      return;
    }

    // Get all admin users
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, default: 'user' },
      isVerified: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true }
    }));

    const admins = await User.find({ role: 'admin' });
    console.log(`\nFound ${admins.length} admin users`);

    if (admins.length === 0) {
      console.log('No admin users found. Creating test admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isActive: true
      });
      await admin.save();
      console.log('✅ Created test admin user');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      return;
    }

    // Test login for each admin
    for (const admin of admins) {
      console.log('\n' + '='.repeat(50));
      console.log(`Admin: ${admin.name || 'No name'} (${admin.email})`);
      console.log('='.repeat(50));
      
      console.log(`Status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`Verified: ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
      
      // Test common passwords
      const testPasswords = ['admin123', 'password', 'admin', '123456', 'Pallab@2005'];
      let foundMatch = false;
      
      for (const password of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(password, admin.password);
          if (isMatch) {
            console.log(`\n✅ Password found: '${password}'`);
            foundMatch = true;
            break;
          }
        } catch (error) {
          console.error(`Error checking password '${password}':`, error.message);
        }
      }
      
      if (!foundMatch) {
        console.log('\n❌ Could not verify password with common test passwords');
        console.log('You may need to reset this admin password');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nCould not connect to MongoDB. Make sure your MongoDB server is running.');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\nDNS lookup failed. Check your internet connection.');
    } else if (error.code === 'ETIMEOUT') {
      console.log('\nConnection timeout. Check if your IP is whitelisted in MongoDB Atlas.');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
  }
}

verifyAdminLogin();
