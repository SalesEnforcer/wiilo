const Invoice = require('../models/Invoice');

// @desc    Get all invoices for Org
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ organization: req.user.organization })
                                  .populate('project', 'name')
                                  .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create Manually (or via Trigger)
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    req.body.organization = req.user.organization;
    const invoice = await Invoice.create(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Mark as Paid
// @route   PUT /api/invoices/:id/pay
exports.markPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      { status: 'paid' }, 
      { new: true }
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
