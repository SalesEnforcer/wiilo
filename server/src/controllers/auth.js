const ErrorResponse = require('../utils/errorResponse'); // We will make this next
const User = require('../models/User');
const Organization = require('../models/Organization');

// @desc    Register user & Create Organization
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, orgName } = req.body;

    // 1. Create the Organization first
    const organization = await Organization.create({
      name: orgName
    });

    // 2. Create the User (Superadmin) linked to that Org
    const user = await User.create({
      name,
      email,
      password,
      role: 'superadmin',
      organization: organization._id
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    // If user creation fails, we might want to rollback org creation, 
    // but for MVP let's just log the error.
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
     res.status(400).json({ success: false, error: err.message });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        org: user.organization
    }
  });
};
