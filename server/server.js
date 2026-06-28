const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./src/config/supabase');

dotenv.config();
testConnection();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

// Mount Routers
const auth = require('./src/routes/auth');
const projects = require('./src/routes/projects'); // Contains nested project-specific chat
const tasks = require('./src/routes/tasks');
const invoices = require('./src/routes/invoices');
const users = require('./src/routes/users');
const globalChat = require('./src/routes/globalChat');
const feedback = require('./src/routes/feedback'); // <--- New

app.use('/api/auth', auth);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);
app.use('/api/invoices', invoices);
app.use('/api/users', users);
app.use('/api/chat', globalChat);
app.use('/api/feedback', feedback); // <--- New Route Base

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

