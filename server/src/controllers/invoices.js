const { supabaseAdmin } = require('../config/supabase');

// Robust UUID sanitizer to prevent Postgres syntax crashes
const cleanUuid = (val) => {
  if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
    return null;
  }
  return val;
};

// Map Postgres invoice row to Mongoose-compatible format
const formatInvoice = (invoice) => {
  return {
    id: invoice.id,
    _id: invoice.id, // For absolute backwards compatibility
    title: invoice.title,
    amount: Number(invoice.amount),
    status: invoice.status,
    clientEmail: invoice.client_email,
    dueDate: invoice.due_date,
    project: invoice.project ? {
      id: invoice.project.id,
      _id: invoice.project.id,
      name: invoice.project.name
    } : invoice.project_id,
    organization: invoice.organization_id,
    createdAt: invoice.created_at
  };
};

// @desc    Get all invoices for Org
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const orgId = cleanUuid(req.user.organization);
    if (!orgId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*, project:project_id(id, name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (invoices || []).map(formatInvoice);
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('getInvoices error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create Manually (or via Trigger)
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    const { title, amount, status, clientEmail, dueDate, project } = req.body;
    
    const sanitizedOrgId = cleanUuid(req.user.organization);
    const sanitizedProjectId = cleanUuid(project);

    const insertData = {
      title,
      amount: amount ? Number(amount) : 0,
      status: status || 'pending',
      client_email: clientEmail || null,
      due_date: dueDate || null,
      project_id: sanitizedProjectId,
      organization_id: sanitizedOrgId
    };

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .insert(insertData)
      .select('*, project:project_id(id, name)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: formatInvoice(invoice) });
  } catch (err) {
    console.error('createInvoice error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Mark as Paid
// @route   PUT /api/invoices/:id/pay
exports.markPaid = async (req, res) => {
  try {
    const invoiceId = cleanUuid(req.params.id);
    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)
      .select('*, project:project_id(id, name)')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: formatInvoice(invoice) });
  } catch (err) {
    console.error('markPaid error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};
