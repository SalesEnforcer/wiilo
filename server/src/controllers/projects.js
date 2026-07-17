const { supabaseAdmin } = require('../config/supabase');

// Robust UUID sanitizer to prevent Postgres syntax crashes
const cleanUuid = (val) => {
  if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
    return null;
  }
  return val;
};

// Helper to transform Postgres project row to Mongo-compatible format
const formatProject = (project, userMap = {}) => {
  const clientsArray = (project.clients || []).map(id => {
    const client = userMap[id];
    return client ? {
      id: client.id,
      _id: client.id,
      name: client.name,
      email: client.email
    } : { id, _id: id };
  });

  const devsArray = (project.devs || []).map(id => {
    const dev = userMap[id];
    return dev ? {
      id: dev.id,
      _id: dev.id,
      name: dev.name,
      email: dev.email
    } : { id, _id: id };
  });

  return {
    id: project.id,
    _id: project.id, // For absolute backwards compatibility
    name: project.name,
    description: project.description,
    status: project.status,
    budget: Number(project.budget),
    organization: project.organization_id,
    
    // 1. Support multiple clients (array of objects)
    clients: clientsArray,
    
    // 2. Absolute backward compatibility: map single client to the first client in the array
    client: clientsArray.length > 0 ? clientsArray[0] : null,
    
    // 3. Support multiple developers
    devs: devsArray,
    progress: 0, // Placeholder to be calculated on projects list load
    createdAt: project.created_at
  };
};

// @desc    Get Projects (SECURE FILTERING)
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const orgId = cleanUuid(req.user.organization);
    if (!orgId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .eq('organization_id', orgId);

    // SECURITY CHECK:
    // If Client, filter by checking if clients array contains their user ID
    if (req.user.role === 'client') {
      query = query.contains('clients', [req.user.id]);
    } else if (req.user.role === 'dev') {
      // If Dev, filter by checking if devs array contains their user ID
      query = query.contains('devs', [req.user.id]);
    }

    // ARCHIVING FILTER
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    } else {
      query = query.neq('status', 'archived');
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    let formattedProjects = [];
    if (projects && projects.length > 0) {
      // Extract all unique user IDs from both devs and clients arrays
      const userIds = [
        ...new Set([
          ...projects.flatMap(p => p.devs || []),
          ...projects.flatMap(p => p.clients || [])
        ])
      ].filter(id => cleanUuid(id) !== null);

      const userMap = {};
      if (userIds.length > 0) {
        const { data: dbUsers, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (usersError) throw usersError;

        if (dbUsers) {
          dbUsers.forEach(u => {
            userMap[u.id] = u;
          });
        }
      }

      // Query tasks in parallel to compute progress percentage for each project
      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('project_id, status')
        .eq('organization_id', orgId);

      const progressMap = {};
      if (!tasksError && tasks) {
        tasks.forEach(t => {
          if (!progressMap[t.project_id]) {
            progressMap[t.project_id] = { total: 0, done: 0 };
          }
          progressMap[t.project_id].total += 1;
          if (t.status === 'done') {
            progressMap[t.project_id].done += 1;
          }
        });
      }

      formattedProjects = projects.map(p => {
        const stats = progressMap[p.id] || { total: 0, done: 0 };
        const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

        const formatted = formatProject(p, userMap);
        formatted.progress = percent; // Add progress calculation
        formatted.totalTasks = stats.total;
        formatted.doneTasks = stats.done;
        return formatted;
      });
    }

    res.status(200).json({ success: true, count: formattedProjects.length, data: formattedProjects });
  } catch (err) {
    console.error('getProjects error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, status, budget, clients, devs } = req.body;

    // Sanitize clients input (supports array or single string)
    let clientsArray = [];
    if (Array.isArray(clients)) {
      clientsArray = clients;
    } else if (typeof clients === 'string' && clients.trim() !== '' && clients !== 'undefined') {
      clientsArray = [clients];
    }

    // Sanitize devs input (supports array or single string)
    let devsArray = [];
    if (Array.isArray(devs)) {
      devsArray = devs;
    } else if (typeof devs === 'string' && devs.trim() !== '' && devs !== 'undefined') {
      devsArray = [devs];
    }

    const sanitizedOrgId = cleanUuid(req.user.organization);
    const sanitizedClients = clientsArray
      .map(id => cleanUuid(id))
      .filter(id => id !== null);
    const sanitizedDevs = devsArray
      .map(id => cleanUuid(id))
      .filter(id => id !== null);

    const insertData = {
      name,
      description: description || 'New Project',
      status: status || 'active',
      budget: budget ? Number(budget) : 0,
      organization_id: sanitizedOrgId,
      clients: sanitizedClients,
      devs: sanitizedDevs
    };

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    // Resolve details for clients and developers
    const userIds = [...new Set([...project.clients, ...project.devs])].filter(id => cleanUuid(id) !== null);
    const userMap = {};

    if (userIds.length > 0) {
      const { data: dbUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      if (dbUsers) {
        dbUsers.forEach(u => {
          userMap[u.id] = u;
        });
      }
    }

    const formattedProject = formatProject(project, userMap);
    formattedProject.progress = 0; // Fresh project has 0 progress
    res.status(201).json({ success: true, data: formattedProject });
  } catch (err) {
    console.error('createProject error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update project (for assignment, unassignment, resignation, description etc)
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const projectId = cleanUuid(req.params.id);
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Invalid project ID' });
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.budget !== undefined) updateData.budget = Number(req.body.budget);

    // Support multiple clients updating
    if (req.body.clients !== undefined) {
      let clientsArray = [];
      if (Array.isArray(req.body.clients)) {
        clientsArray = req.body.clients;
      } else if (typeof req.body.clients === 'string' && req.body.clients.trim() !== '' && req.body.clients !== 'undefined') {
        clientsArray = [req.body.clients];
      }
      updateData.clients = clientsArray
        .map(id => cleanUuid(id))
        .filter(id => id !== null);
    }

    // Support multiple devs updating
    if (req.body.devs !== undefined) {
      let devsArray = [];
      if (Array.isArray(req.body.devs)) {
        devsArray = req.body.devs;
      } else if (typeof req.body.devs === 'string' && req.body.devs.trim() !== '' && req.body.devs !== 'undefined') {
        devsArray = [req.body.devs];
      }
      updateData.devs = devsArray
        .map(id => cleanUuid(id))
        .filter(id => id !== null);
    }

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select('*')
      .single();

    if (error) throw error;

    // Resolve user profiles
    const userIds = [...new Set([...(project.clients || []), ...(project.devs || [])])].filter(id => cleanUuid(id) !== null);
    const userMap = {};

    if (userIds.length > 0) {
      const { data: dbUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      if (dbUsers) {
        dbUsers.forEach(u => {
          userMap[u.id] = u;
        });
      }
    }

    // Recalculate progress for update as well
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('status')
      .eq('project_id', project.id);

    let progress = 0;
    if (tasks && tasks.length > 0) {
      const doneTasks = tasks.filter(t => t.status === 'done').length;
      progress = Math.round((doneTasks / tasks.length) * 100);
    }

    const formattedProject = formatProject(project, userMap);
    formattedProject.progress = progress;
    res.status(200).json({ success: true, data: formattedProject });
  } catch (err) {
    console.error('updateProject error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const projectId = cleanUuid(req.params.id);
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Invalid project ID' });
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('deleteProject error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};
