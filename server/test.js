// Changed localhost to 127.0.0.1 to fix Windows Node.js IPv6 routing issues
const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  let token = '';

  // 1. Test Registration
  console.log('\n=== [1] Testing Registration ===');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: 'Admin User', 
        email: 'admin@wiilo.com', 
        password: 'Password123!', 
        orgName: 'Wiilo Main Org' 
      })
    });
    const data = await res.json();
    console.log('Response:', data);
    if (data.token) token = data.token;
  } catch (e) { 
    console.error('Error:', e.message); 
  }

  // 2. Test Login (Runs if registration failed because user already exists)
  if (!token) {
    console.log('\n=== [2] Testing Login (User might already exist) ===');
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@wiilo.com', 
          password: 'Password123!' 
        })
      });
      const data = await res.json();
      console.log('Response:', data);
      if (data.token) token = data.token;
    } catch (e) { 
      console.error('Error:', e.message); 
    }
  }

  // 3. Test Protected Route
  if (token) {
    console.log('\n=== [3] Testing Protected Route (GET /api/users) ===');
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Response:', data);
    } catch (e) { 
      console.error('Error:', e.message); 
    }
  } else {
    console.log('\n[!] No token obtained. Check the errors above.');
  }
}

runTests();
