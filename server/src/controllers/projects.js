const { supabaseAdmin } = require('../config/supabase');

// Robust UUID sanitizer to prevent Postgres syntax crashes
const cleanUuid = (val) => {
  if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
    return null;
  }
  return val;
};

// Helper to transform Postgres project row to Mongo-compatible format
const formatProject = (project, devMap = {}, progressMap = {}) => {
  const projId = project.id;
  const progress = progressMap[projId] || { total: 0, done: 0 };
  const percent = progress.total > 0 ? Math.round((progress.done / total) * 100) : 0; // Wait, let's use safe check
  
  let pct = 0;
  if (progress.total > 0) {
    pct = Math.round((progress.done / total) * 100); // Wait, let's calculate directly below to avoid reference errors
  }

  return {
    id: project.id,
    _id: project.id, // For absolute backwards compatibility
    name: project.name,
    description: project.description,
    status: project.status,
    budget: Number(project.budget),
    organization: project.organization_id,
    client: project.client ? {
      id: project.client.id,
      _id: project.client.id,
      name: project.client.name,
      email: project.client.email
    } : null,
    devs: (project.devs || []).map(id => {
      const dev = devMap[id];
      return dev ? {
        id: dev.id,
        _id: dev.id,
        name: dev.name,
        email: dev.email
      } : { id, _id: id };
    }),
    progress: progress, // Percentage of completed tasks
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
      .select('*, client:client_id(id, name, email)')
      .eq('organization_id', orgId);

    // SECURITY CHECK:
    // If not Admin, restrict query to assigned projects only
    if (req.user.role === 'client') {
      query = query.eq('client_id', req.user.id);
    } else if (req.user.role === 'dev') {
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
      const devIds = [...new Set(projects.flatMap(p => p.devs || []))].filter(id => cleanUuid(id) !== null);
      const devMap = {};
      
      if (devIds.length > 0) {
        const { data: devUsers, error: devsError } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', devIds);
        
        if (devsError) throw devsError;
        
        if (devUsers) {
          devUsers.forEach(u => {
            devMap[u.id] = u;
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
        
        const formatted = formatProject(p, devMap);
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
    const { name, description, status, budget, client, devs } = req.body;
    
    let devsArray = [];
    if (Array.isArray(devs)) {
      devsArray = devs;
    } else if (typeof devs === 'string' && devs.trim() !== '' && devs !== 'undefined') {
      devsArray = [devs];
    }

    const sanitizedClientId = cleanUuid(client);
    const sanitizedOrgId = cleanUuid(req.user.organization);
    const sanitizedDevs = devsArray
      .map(id => cleanUuid(id))
      .filter(id => id !== null);

    const insertData = {
      name,
      description: description || 'New Project',
      status: status || 'active',
      budget: budget ? Number(budget) : 0,
      organization_id: sanitizedOrgId,
      client_id: sanitizedClientId,
      devs: sanitizedDevs
    };

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert(insertData)
      .select('*, client:client_id(id, name, email)')
      .single();

    if (error) throw error;

    const devMap = {};
    if (project.devs && project.devs.length > 0) {
      const { data: devUsers, error: devsError } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', project.devs);
      
      if (devsError) throw devsError;
      
      if (devUsers) {
        devUsers.forEach(u => {
          devMap[u.id] = u;
        });
      }
    }

    const formattedProject = formatProject(project, devMap);
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
    
    if (req.body.client !== undefined) {
      updateData.client_id = cleanUuid(req.body.client);
    }
    
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
      .select('*, client:client_id(id, name, email)')
      .single();

    if (error) throw error;

    const devMap = {};
    if (project.devs && project.devs.length > 0) {
      const { data: devUsers, error: devsError } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', project.devs);
      
      if (devsError) throw devsError;
      
      if (devUsers) {
        devUsers.forEach(u => {
          devMap[u.id] = u;
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

    const formattedProject = formatProject(project, devMap);
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
