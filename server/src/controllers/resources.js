const { supabaseAdmin } = require('../config/supabase');

// Robust UUID sanitizer to prevent Postgres syntax crashes
const cleanUuid = (val) => {
  if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
    return null;
  }
  return val;
};

// Helper to map Postgres resource rows to Mongoose-compatible format
const formatResource = (res) => {
  return {
    id: res.id,
    _id: res.id, // Absolute backwards compatibility
    title: res.title,
    url: res.url,
    type: res.type,
    project: res.project_id,
    organization: res.organization_id,
    createdAt: res.created_at
  };
};

// @desc    Get Resources for Project
// @route   GET /api/projects/:projectId/resources
exports.getResources = async (req, res) => {
  try {
    const projectId = cleanUuid(req.params.projectId);
    if (!projectId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data: resources, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (resources || []).map(formatResource);
    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('getResources error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add Resource
// @route   POST /api/projects/:projectId/resources
exports.addResource = async (req, res) => {
  try {
    const projectId = cleanUuid(req.params.projectId);
    const orgId = cleanUuid(req.user.organization);

    if (!projectId || !orgId) {
      return res.status(400).json({ success: false, error: 'Invalid project or organization' });
    }

    const insertData = {
      title: req.body.title,
      url: req.body.url,
      type: req.body.type || 'link',
      project_id: projectId,
      organization_id: orgId
    };

    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: formatResource(resource) });
  } catch (err) {
    console.error('addResource error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};
