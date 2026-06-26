const { supabaseAdmin } = require('../config/supabase');

// Robust UUID sanitizer to prevent Postgres syntax crashes
const cleanUuid = (val) => {
  if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
    return null;
  }
  return val;
};

// Helper to map Postgres message rows to Mongoose-compatible format
const formatMessage = (msg) => {
  return {
    id: msg.id,
    _id: msg.id, // For absolute backwards compatibility
    content: msg.content,
    project: msg.project ? {
      id: msg.project.id,
      _id: msg.project.id,
      name: msg.project.name
    } : msg.project_id,
    sender: msg.sender ? {
      id: msg.sender.id,
      _id: msg.sender.id,
      name: msg.sender.name,
      role: msg.sender.role
    } : msg.sender_id,
    createdAt: msg.created_at
  };
};

// @desc    Get messages for a specific project
// @route   GET /api/projects/:projectId/messages
exports.getMessages = async (req, res) => {
  try {
    const projectId = cleanUuid(req.params.projectId);
    if (!projectId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*, sender:sender_id(id, name, role)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatted = (messages || []).map(formatMessage);
    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('getMessages error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Send a message
// @route   POST /api/projects/:projectId/messages
exports.sendMessage = async (req, res) => {
  try {
    const projectId = cleanUuid(req.params.projectId);
    const senderId = cleanUuid(req.user.id);

    if (!projectId || !senderId) {
      return res.status(400).json({ success: false, error: 'Invalid project or sender' });
    }

    const insertData = {
      content: req.body.content,
      project_id: projectId,
      sender_id: senderId
    };

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert(insertData)
      .select('*, sender:sender_id(id, name, role)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: formatMessage(message) });
  } catch (err) {
    console.error('sendMessage error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get Recent Messages (Global Feed)
// @route   GET /api/chat/recent
exports.getRecentMessages = async (req, res) => {
  try {
    const orgId = cleanUuid(req.user.organization);
    if (!orgId) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 1. Find Projects the user is part of
    let projectQuery = supabaseAdmin
      .from('projects')
      .select('id')
      .eq('organization_id', orgId);

    if (req.user.role === 'client') {
      projectQuery = projectQuery.eq('client_id', req.user.id);
    } else if (req.user.role === 'dev') {
      projectQuery = projectQuery.contains('devs', [req.user.id]);
    }

    const { data: myProjects, error: projectsError } = await projectQuery;
    if (projectsError) throw projectsError;

    const projectIds = (myProjects || []).map(p => p.id);
    if (projectIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. Find messages in those projects (Limit 5, Newest first)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*, sender:sender_id(id, name, role), project:project_id(id, name)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messagesError) throw messagesError;

    const formatted = (messages || []).map(formatMessage);
    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('getRecentMessages error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
