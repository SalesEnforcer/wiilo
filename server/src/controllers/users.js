const { supabaseAdmin } = require('../config/supabase');

exports.getTeam = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin.from('users')
      .select('id, name, email, role, created_at').eq('organization_id', req.user.organization).order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.addMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { name, role, organization_id: req.user.organization }
    });
    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabaseAdmin.from('users').select('*').eq('id', authData.user.id).single();
    if (profileError) throw profileError;
    res.status(201).json({ success: true, data: profile });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.email) fieldsToUpdate.email = req.body.email;

    if (req.body.password) {
      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: req.body.password });
      if (pwdError) throw pwdError;
    }

    const { data: user, error } = await supabaseAdmin.from('users').update(fieldsToUpdate).eq('id', req.user.id).select().single();
    if (error) throw error;
    res.status(200).json({ success: true, data: user });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};
