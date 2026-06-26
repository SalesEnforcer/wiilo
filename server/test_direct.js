const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use Anon key for Auth!
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testDirect() {
  console.log("\n--- [1] Testing DB Insert (Admin) ---");
  const { data: org, error: orgErr } = await supabaseAdmin.from('organizations').insert({ name: 'Direct Test Org 2' }).select().single();
  if (orgErr) { console.error("FAILED DB INSERT:", orgErr.message); return; }
  console.log("Success! Org ID:", org.id);

  console.log("\n--- [2] Testing Supabase Auth Signup (Anon) ---");
  const { data: auth, error: authErr } = await supabase.auth.signUp({
    email: `direct_test_${Date.now()}@wiilo.com`, // unique email
    password: 'Password123!',
    options: { data: { name: 'Direct User', role: 'superadmin', organization_id: org.id } }
  });
  if (authErr) { console.error("FAILED AUTH SIGNUP:", authErr); return; }
  console.log("Success! Auth User ID:", auth.user.id);

  console.log("\n--- [3] Testing DB Trigger (Admin) ---");
  const { data: profile, error: profErr } = await supabaseAdmin.from('users').select('*').eq('id', auth.user.id).single();
  if (profErr) { console.error("FAILED TRIGGER:", profErr.message); return; }
  console.log("Success! Profile created:", profile);
}
testDirect();
