const { getProjects, createProject } = require('./src/controllers/projects');

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

const runTest = async () => {
  console.log('--- TESTING getProjects (Superadmin Role) ---');
  
  // Mock request object with a random UUID for organization
  const req = {
    user: {
      organization: 'd19b4cf0-a083-4966-8802-dc90e66336be', // Mock UUID
      role: 'superadmin',
      id: 'fa4f1fb4-345f-4a00-98b7-68b31ea67b36'
    }
  };
  
  const res = mockResponse();
  
  try {
    await getProjects(req, res);
    console.log('Status Code:', res.statusCode);
    console.log('Response Payload:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    console.error('Test threw an uncaught error:', err);
  }
};

runTest();
