const { supabaseAdmin } = require('../config/supabase');

// @desc    Get Team members (supports query parameter status=archived)
// @route   GET /api/users
exports.getTeam = async (req, res) => {
  try {
    let query = supabaseAdmin.from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('organization_id', req.user.organization);

    // If query ?status=archived is passed, load archived; else load active
    if (req.query.status === 'archived') {
      query = query.eq('is_active', false);
    } else {
      query = query.eq('is_active', true);
    }

    const { data: users, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
};

// @desc    Add member & create Supabase auth
// @route   POST /api/users
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
  } catch (err) { 
    res.status(400).json({ success: false, error: err.message }); 
  }
};

// @desc    Update a team member (Admin only - edit name, role, or is_active)
// @route   PUT /api/users/:id
exports.updateMember = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Access denied: Admin only' });
    }

    const memberId = req.params.id;
    const fieldsToUpdate = {};
    
    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
    if (req.body.role !== undefined) fieldsToUpdate.role = req.body.role;
    if (req.body.isActive !== undefined) fieldsToUpdate.is_active = req.body.isActive;

    // 1. Sync name or role with Supabase Auth metadata
    if (req.body.name || req.body.role) {
      const updateMeta = {};
      if (req.body.name) updateMeta.name = req.body.name;
      if (req.body.role) updateMeta.role = req.body.role;
      
      await supabaseAdmin.auth.admin.updateUserById(memberId, {
        user_metadata: updateMeta
      });
    }

    // 2. Lockout deactivation: ban/unban user in Supabase Auth
    if (req.body.isActive === false) {
      await supabaseAdmin.auth.admin.updateUserById(memberId, {
        ban_duration: '87660h' // Ban account for 10 years
      });
    } else if (req.body.isActive === true) {
      await supabaseAdmin.auth.admin.updateUserById(memberId, {
        ban_duration: 'none' // Remove ban
      });
    }

    const { data: user, error } = await supabaseAdmin.from('users')
      .update(fieldsToUpdate)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data: user });
  } catch (err) { 
    res.status(400).json({ success: false, error: err.message }); 
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
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
  } catch (err) { 
    res.status(400).json({ success: false, error: err.message }); 
  }
};
