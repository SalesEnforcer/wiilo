const { supabaseAdmin } = require('./src/config/supabase');

const testDirectInsert = async () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const testEmail = `direct_db_${timestamp}@example.com`;
  const dummyUserId = "00000000-0000-0000-0000-000000000001"; // Test UUID format

  console.log('--- TESTING DIRECT INSERT TO public.users ---');
  
  // 1. Create a temporary organization first to satisfy foreign key constraint
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name: `Direct Org ${timestamp}` })
    .select()
    .single();

  if (orgError) {
    console.error('Failed to create organization:', orgError.message);
    return;
  }
  console.log('Org created successfully:', org.id);

  // 2. Try to insert directly into public.users
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: "a34d3148-e818-4e8c-8f92-56338ebca681", // Random unique UUID
      name: `Direct User ${timestamp}`,
      email: testEmail,
      role: 'superadmin',
      organization_id: org.id
    })
    .select()
    .single();

  if (userError) {
    console.error('Direct user insertion FAILED.');
    console.error('Error Details:', userError);
  } else {
    console.log('Direct user insertion SUCCEEDED!');
    console.log('Inserted User Profile:', user);

    // Cleanup
    await supabaseAdmin.from('users').delete().eq('id', user.id);
  }

  // Cleanup organization
  await supabaseAdmin.from('organizations').delete().eq('id', org.id);
};

testDirectInsert();
