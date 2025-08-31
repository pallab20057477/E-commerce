const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

async function testAdminLogin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    console.log(`\nFound ${admins.length} admin users`);

    if (admins.length === 0) {
      console.log('No admin users found. Creating a test admin...');
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
      console.log(`Testing login for admin: ${admin.email}`);
      console.log('='.repeat(50));

      // Test password verification
      const testPasswords = ['admin123', 'password', 'admin', '123456', 'Pallab@2005'];
      
      for (const password of testPasswords) {
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log(`Password '${password}': ${isMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (isMatch) {
          console.log('\n✅ Login successful with password:', password);
          console.log('\nGenerating JWT token...');
          const token = jwt.sign(
            { userId: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );
          console.log('\nJWT Token:', token);
          console.log('\nYou can use this token in your frontend with the Authorization header:');
          console.log(`Authorization: Bearer ${token}`);
          return;
        }
      }
    }

    console.log('\n❌ Could not log in with any common passwords');
    console.log('Try resetting the admin password using the forgot password feature.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

testAdminLogin();
