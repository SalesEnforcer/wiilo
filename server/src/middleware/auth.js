const { supabaseAdmin } = require('../config/supabase');

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Not authorized' });

  try {
    // Verify token using Admin client
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ success: false, error: 'Invalid token' });

    const { data: profile } = await supabaseAdmin.from('users')
      .select('id, name, email, role, organization_id').eq('id', authUser.id).single();
    if (!profile) return res.status(401).json({ success: false, error: 'Profile not found' });

    req.user = { ...profile, organization: profile.organization_id };
    next();
  } catch (err) { return res.status(401).json({ success: false, error: 'Not authorized' }); }
};
