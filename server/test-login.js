const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testLogin(email, password, role = 'admin') {
  try {
    console.log(`\n=== Testing Login ===`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
      role
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: status => status < 600 // Don't throw on HTTP error status codes
    });

    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\n✅ Login successful!');
      console.log('Token:', response.data.token.substring(0, 30) + '...');
    } else {
      console.log('\n❌ Login failed');
    }
    
    return response;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received. Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error message:', error.message);
    }
    
    console.log('Config:', error.config);
    throw error;
  }
}

// Run the test
async function runTest() {
  try {
    // Test with admin credentials (replace with actual test credentials)
    await testLogin('admin@example.com', 'Pallab@2005', 'admin');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();
