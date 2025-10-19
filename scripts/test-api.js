const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Rich OneBox Emails API...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test system status
    console.log('\n2. Testing system status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/system/status`);
    console.log('✅ System status:', statusResponse.data.data);

    // Test accounts endpoint
    console.log('\n3. Testing accounts endpoint...');
    const accountsResponse = await axios.get(`${BASE_URL}/api/accounts`);
    console.log('✅ Accounts endpoint working, found', accountsResponse.data.data.length, 'accounts');

    // Test emails endpoint
    console.log('\n4. Testing emails endpoint...');
    const emailsResponse = await axios.get(`${BASE_URL}/api/emails`);
    console.log('✅ Emails endpoint working, found', emailsResponse.data.data.emails.length, 'emails');

    // Test email stats
    console.log('\n5. Testing email stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/emails/stats`);
    console.log('✅ Email stats:', statsResponse.data.data);

    // Test system status
    console.log('\n6. Testing system status...');
    const systemResponse = await axios.get(`${BASE_URL}/api/system/status`);
    console.log('✅ System status:', {
      imap: systemResponse.data.data.imap,
      database: systemResponse.data.data.database,
      uptime: systemResponse.data.data.uptime
    });

    console.log('\n🎉 All API tests passed!');
    console.log('\nYou can now:');
    console.log('- Visit http://localhost:3000 for the web interface');
    console.log('- Import postman-collection.json into Postman for API testing');
    console.log('- Add email accounts using the API or web interface');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testAPI();

