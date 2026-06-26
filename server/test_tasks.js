const { getTasks } = require('./src/controllers/tasks');

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

const runTasksTest = async () => {
  console.log('--- TESTING getTasks (Empty Project Database Check) ---');

  const req = {
    params: {
      projectId: 'ca050cf1-01e1-44e3-abe8-a27ed2f7092e' // A mock/dummy project UUID
    }
  };

  const res = mockResponse();

  try {
    await getTasks(req, res);
    console.log('Status Code:', res.statusCode);
    console.log('Response Payload:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    console.error('Tasks Test threw an uncaught error:', err);
  }
};

runTasksTest();
