const { supabase, supabaseAdmin } = require('../config/supabase');

exports.register = async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;

    // 1. Create Org
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations').insert({ name: orgName }).select().single();
    if (orgError) throw orgError;

    // 2. Sign up
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role: 'superadmin', organization_id: organization.id } }
    });

    if (error) {
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
      throw error;
    }

    if (!data.session) return res.status(201).json({ success: true, message: 'Registered. Check email.' });

    // Return access token and refresh token
    res.status(200).json({
      success: true, 
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: { id: data.user.id, name, email, role: 'superadmin', org: organization.id }
    });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const { data: profile } = await supabaseAdmin.from('users')
      .select('id, name, email, role, organization_id').eq('id', data.user.id).single();

    // Return access token and refresh token
    res.status(200).json({ 
      success: true, 
      token: data.session.access_token, 
      refreshToken: data.session.refresh_token,
      user: profile 
    });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

// @desc    Refresh session using refresh token
// @route   POST /api/auth/refresh
exports.refreshSession = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return res.status(401).json({ success: false, error: 'Invalid refresh token' });

    res.status(200).json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Request Password Reset Email
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const redirectToUrl = process.env.CLIENT_URL || 'http://localhost:4200/settings';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl
    });

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Reset link sent to your email.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
