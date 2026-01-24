const User = require('../models/User');

// @desc    Get all users (Existing)
exports.getTeam = async (req, res) => {
  try {
    const users = await User.find({ organization: req.user.organization })
                            .select('-password')
                            .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add Member (Existing)
exports.addMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({
      name, email, password, role,
      organization: req.user.organization
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update My Profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    // If password is sent, we need to handle it separately to trigger hashing
    if (req.body.password) {
      const user = await User.findById(req.user.id);
      user.password = req.body.password;
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      await user.save(); // Triggers the pre-save hook for bcrypt
      
      // Return without password
      const updatedUser = user.toObject();
      delete updatedUser.password;
      return res.status(200).json({ success: true, data: updatedUser });
    }

    // Standard update
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
