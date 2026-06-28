const { supabaseAdmin } = require('../config/supabase');

// @desc    Submit user feedback/suggestion
// @route   POST /api/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { suggestion } = req.body;
    if (!suggestion || !suggestion.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback cannot be empty.' });
    }

    const insertData = {
      user_id: req.user.id,
      user_name: req.user.name,
      user_email: req.user.email,
      suggestion: suggestion.trim()
    };

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('submitFeedback error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};
