const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const { testConnection } = require('./src/config/supabase');

dotenv.config();
testConnection();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

// Mount Routers
const auth = require('./src/routes/auth');
const projects = require('./src/routes/projects');
const tasks = require('./src/routes/tasks');
const invoices = require('./src/routes/invoices');
const users = require('./src/routes/users');
const globalChat = require('./src/routes/globalChat');
const feedback = require('./src/routes/feedback');

app.use('/api/auth', auth);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);
app.use('/api/invoices', invoices);
app.use('/api/users', users);
app.use('/api/chat', globalChat);
app.use('/api/feedback', feedback);

// 1. HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// 2. DEV OPS KEEP-ALIVE PING ROUTINE (Prevents Render spin-down)
const startKeepAlive = () => {
  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) {
    console.log('Keep-Alive: PUBLIC_URL is not defined in .env. Skipping keep-alive ping.');
    return;
  }

  console.log(`Keep-Alive: Initialized self-pinging routine for ${publicUrl} every 10 minutes.`);

  // Ping every 10 minutes (600,000 ms)
  setInterval(() => {
    const pingUrl = `${publicUrl}/api/health`;
    const client = publicUrl.startsWith('https') ? https : http;

    client.get(pingUrl, (res) => {
      res.resume();
      console.log(`Keep-Alive Ping Success: Status ${res.statusCode} received from ${pingUrl}`);
    }).on('error', (err) => {
      console.error(`Keep-Alive Ping Failed: ${err.message}`);
    });
  }, 600000);
};

startKeepAlive();

