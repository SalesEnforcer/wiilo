const { supabaseAdmin } = require('../config/supabase');

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Not authorized' });

  try {
    // Verify token using Admin client
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ success: false, error: 'Invalid token' });

    // Fetch profile and check is_active status
    const { data: profile } = await supabaseAdmin.from('users')
      .select('id, name, email, role, organization_id, is_active').eq('id', authUser.id).single();
      
    if (!profile) return res.status(401).json({ success: false, error: 'Profile not found' });
    if (profile.is_active === false) return res.status(401).json({ success: false, error: 'Account disabled' });

    req.user = { ...profile, organization: profile.organization_id };
    next();
  } catch (err) { 
    return res.status(401).json({ success: false, error: 'Not authorized' }); 
  }
};
