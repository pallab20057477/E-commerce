const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock request and response objects
const mockRequest = (body = {}) => ({
  body,
  params: {},
  query: {},
  user: null
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Import the login function directly
const { login } = require('./controllers/authController');

async function testLoginFlow() {
  try {
    console.log('Starting login flow test...');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // Load User model
    const User = require('./models/User');
    
    // Find or create a test admin user
    let admin = await User.findOne({ email: 'admin@example.com', role: 'admin' });
    
    if (!admin) {
      console.log('Creating test admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = new User({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isActive: true
      });
      await admin.save();
      console.log('✅ Created test admin user');
    }

    console.log('\n=== Test Admin Credentials ===');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('============================\n');

    // Test 1: Correct credentials
    console.log('Test 1: Testing with correct credentials...');
    const req1 = mockRequest({
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    const res1 = mockResponse();
    
    await login(req1, res1);
    
    console.log('Response status:', res1.status.mock.calls[0]?.[0]);
    console.log('Response data:', res1.json.mock.calls[0]?.[0]);
    
    if (res1.status.mock.calls[0]?.[0] === 200) {
      console.log('✅ Test 1: Login successful!');
      console.log('JWT Token:', res1.json.mock.calls[0]?.[0]?.token);
    } else {
      console.log('❌ Test 1: Login failed');
    }

    // Test 2: Wrong password
    console.log('\nTest 2: Testing with wrong password...');
    const req2 = mockRequest({
      email: 'admin@example.com',
      password: 'wrongpassword',
      role: 'admin'
    });
    const res2 = mockResponse();
    
    await login(req2, res2);
    
    console.log('Response status:', res2.status.mock.calls[0]?.[0]);
    console.log('Response message:', res2.json.mock.calls[0]?.[0]?.message);
    
    if (res2.status.mock.calls[0]?.[0] === 400) {
      console.log('✅ Test 2: Correctly rejected wrong password');
    } else {
      console.log('❌ Test 2: Unexpected response for wrong password');
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
  }
}

testLoginFlow();
