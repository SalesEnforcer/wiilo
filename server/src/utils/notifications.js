const { supabaseAdmin } = require('../config/supabase');

exports.createNotification = async ({ organizationId, userId = null, title, message }) => {
  try {
    const insertData = {
      organization_id: organizationId,
      user_id: userId,
      title,
      message,
      is_read: false
    };

    await supabaseAdmin.from('notifications').insert(insertData);
    console.log(`[NOTIFICATION LOGGED] ${title}: ${message}`);
  } catch (err) {
    console.error('Failed to create notification log:', err.message);
  }
};
