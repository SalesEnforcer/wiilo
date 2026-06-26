const { register, login } = require('./src/controllers/auth');

// Mock Express response object
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const runAuthTest = async () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const testEmail = `tester_${timestamp}@example.com`;
  const testPassword = "Password123!";
  const testOrgName = `Test Company ${timestamp}`;
  const testUserName = `Tester ${timestamp}`;

  console.log('--- TESTING REGISTER ENDPOINT ---');
  console.log(`Registering: Email: ${testEmail}, Org: ${testOrgName}`);

  const regReq = {
    body: {
      name: testUserName,
      email: testEmail,
      password: testPassword,
      orgName: testOrgName
    }
  };

  const regRes = mockResponse();

  try {
    await register(regReq, regRes);
    console.log('Register Status Code:', regRes.statusCode);
    console.log('Register Response Payload:', JSON.stringify(regRes.body, null, 2));

    if (regRes.statusCode !== 200 && regRes.statusCode !== 201) {
      console.log('Registration was not successful, skipping login test.');
      return;
    }

    console.log('\n--- TESTING LOGIN ENDPOINT ---');
    console.log(`Logging in with: ${testEmail}`);

    const loginReq = {
      body: {
        email: testEmail,
        password: testPassword
      }
    };

    const loginRes = mockResponse();
    await login(loginReq, loginRes);
    console.log('Login Status Code:', loginRes.statusCode);
    console.log('Login Response Payload:', JSON.stringify(loginRes.body, null, 2));

  } catch (err) {
    console.error('Auth Test threw an uncaught error:', err);
  }
};

runAuthTest();
