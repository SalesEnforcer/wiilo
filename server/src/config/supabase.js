const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
// Fallback to service key if anon key is not defined in .env
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_KEY) in .env');
  process.exit(1);
}

// 1. Standard Client - Fallback to Service Key if Anon Key is missing
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// 2. Admin Client (Uses Service Role Key) - Required for DB queries & bypassing RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const testConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin.from('organizations').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      console.error('Supabase Connection Error:', error.message);
    } else {
      console.log('Supabase Connected successfully!');
    }
  } catch (err) {
    console.error('Supabase Connection Failed:', err.message);
  }
};

module.exports = { supabase, supabaseAdmin, testConnection };
