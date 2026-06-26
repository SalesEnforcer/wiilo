const { supabase, supabaseAdmin } = require('../config/supabase');

exports.register = async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;

    // 1. Create Org using Admin client (Bypasses RLS)
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations').insert({ name: orgName }).select().single();
    if (orgError) throw orgError;

    // 2. Sign up using Standard client (Anon Key required for Auth)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role: 'superadmin', organization_id: organization.id } }
    });

    if (error) {
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
      throw error;
    }

    if (!data.session) return res.status(201).json({ success: true, message: 'Registered. Check email.' });

    res.status(200).json({
      success: true, token: data.session.access_token,
      user: { id: data.user.id, name, email, role: 'superadmin', org: organization.id }
    });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    // Use Standard client for login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Fetch profile using Admin client
    const { data: profile } = await supabaseAdmin.from('users')
      .select('id, name, email, role, organization_id').eq('id', data.user.id).single();

    res.status(200).json({ success: true, token: data.session.access_token, user: profile });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};
