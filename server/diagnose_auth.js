const { supabaseAdmin } = require('./src/config/supabase');

const runAdminDiagnosis = async () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const testEmail = `admin_diag_${timestamp}@example.com`;
  const testPassword = "Password123!";
  const testOrgName = `Diag Org ${timestamp}`;
  const testUserName = `Diag Admin User ${timestamp}`;

  console.log('--- DIAGNOSIS: STEP 1 - CREATING ORGANIZATION ---');
  let organization = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert({ name: testOrgName })
      .select()
      .single();

    if (error) {
      console.log('Organization insertion FAILED:', error);
      return;
    }
    organization = data;
    console.log('Organization insertion SUCCEEDED:', organization);
  } catch (err) {
    console.log('Organization insertion exception:', err);
    return;
  }

  console.log('\n--- DIAGNOSIS: STEP 2 - ADMIN USER CREATION ---');
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email to bypass SMTP requirements
      user_metadata: { 
        name: testUserName, 
        role: 'superadmin', 
        organization_id: organization.id 
      }
    });

    if (error) {
      console.log('Admin User Creation FAILED.');
      console.log('Error Object:', JSON.stringify(error, null, 2));
      console.log('Raw Error:', error);
      
      // Cleanup
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
      return;
    }

    console.log('Admin User Creation SUCCEEDED!');
    console.log('User Object:', data.user ? `ID: ${data.user.id}, Email: ${data.user.email}` : 'No user returned');
    
    // Check if the user synced to public.users table via the SQL trigger
    console.log('\n--- DIAGNOSIS: STEP 3 - VERIFYING SQL TRIGGER SYNC ---');
    const { data: publicProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.log('SQL Sync Trigger failed to create public.users profile.');
      console.log('Profile Error:', profileError.message);
    } else {
      console.log('SQL Sync Trigger SUCCEEDED!');
      console.log('Public User Profile:', publicProfile);
    }

  } catch (err) {
    console.log('Admin User Creation threw exception:', err);
  }
};

runAdminDiagnosis();
