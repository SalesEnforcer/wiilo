const { supabaseAdmin } = require('../config/supabase');

// @desc    Get recent unread notifications for Org
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('organization_id', req.user.organization)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark all unread notifications as read
// @route   PUT /api/notifications/read
exports.markNotificationsRead = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('organization_id', req.user.organization)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('markNotificationsRead error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};
