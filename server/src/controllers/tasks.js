const { supabaseAdmin } = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// Helper to hydrate comments with user details and map schema keys
const hydrateTasksComments = async (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  // 1. Collect unique user IDs from all comments
  const userIds = new Set();
  tasks.forEach(task => {
    const comments = task.comments || [];
    comments.forEach(c => {
      if (c.user) userIds.add(c.user);
    });
  });

  const uniqueUserIds = [...userIds];
  const userMap = {};

  if (uniqueUserIds.length > 0) {
    // Fetch users details
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, role')
      .in('id', uniqueUserIds);

    if (error) throw error;

    if (users) {
      users.forEach(u => {
        userMap[u.id] = u;
      });
    }
  }

  // 2. Map Postgres task rows to Mongoose-compatible format
  return tasks.map(task => {
    const hydratedComments = (task.comments || []).map(c => ({
      text: c.text,
      createdAt: c.createdAt || c.created_at,
      user: userMap[c.user] ? {
        id: userMap[c.user].id,
        _id: userMap[c.user].id,
        name: userMap[c.user].name,
        role: userMap[c.user].role
      } : { id: c.user, _id: c.user, name: 'Unknown User', role: 'dev' }
    }));

    return {
      id: task.id,
      _id: task.id, // For absolute compatibility
      title: task.title,
      description: task.description,
      status: task.status,
      isBlocked: task.is_blocked,
      milestone: task.milestone,
      dueDate: task.due_date,
      project: task.project_id,
      organization: task.organization_id,
      comments: hydratedComments,
      subtasks: task.subtasks || [], // Hydrate subtasks array
      createdAt: task.created_at
    };
  });
};

// @desc    Get Tasks
// @route   GET /api/projects/:projectId/tasks
exports.getTasks = async (req, res) => {
  try {
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const hydrated = await hydrateTasksComments(tasks);
    res.status(200).json({ success: true, data: hydrated });
  } catch (err) {
    console.error('getTasks error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create Task
// @route   POST /api/projects/:projectId/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, isBlocked, milestone, dueDate } = req.body;

    const insertData = {
      title,
      description,
      status: status || 'todo',
      is_blocked: isBlocked !== undefined ? isBlocked : false,
      milestone: milestone || 'Backlog',
      due_date: dueDate || null,
      project_id: req.params.projectId,
      organization_id: req.user.organization,
      comments: [], // default empty jsonb array
      subtasks: [] // default empty subtasks jsonb array
    };

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    if (task) { 
      await createNotification({ 
        organizationId: task.organization_id, 
        title: 'Task Created', 
        message: `${req.user.name} created task "${task.title}"` 
      }); 
    }

    const hydratedList = await hydrateTasksComments([task]);
    res.status(201).json({ success: true, data: hydratedList[0] });
  } catch (err) {
    console.error('createTask error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update Task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.isBlocked !== undefined) updateData.is_blocked = req.body.isBlocked;
    if (req.body.milestone !== undefined) updateData.milestone = req.body.milestone;
    if (req.body.dueDate !== undefined) updateData.due_date = req.body.dueDate;
    if (req.body.comments !== undefined) updateData.comments = req.body.comments;
    if (req.body.subtasks !== undefined) updateData.subtasks = req.body.subtasks; // Update subtasks array

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    const hydratedList = await hydrateTasksComments([task]);
    res.status(200).json({ success: true, data: hydratedList[0] });
  } catch (err) {
    console.error('updateTask error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Add Comment
// @route   POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) return res.status(404).json({ error: 'Task not found' });

    const existingComments = task.comments || [];
    const newComment = {
      text: req.body.text,
      user: req.user.id,
      createdAt: new Date().toISOString()
    };

    existingComments.unshift(newComment);

    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({ comments: existingComments })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    if (updatedTask) { 
      await createNotification({ 
        organizationId: updatedTask.organization_id, 
        title: 'Comment Added', 
        message: `${req.user.name} commented on task "${updatedTask.title}"` 
      }); 
    }

    const hydratedList = await hydrateTasksComments([updatedTask]);
    res.status(200).json({ success: true, data: hydratedList[0] });
  } catch (err) {
    console.error('addComment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
