var bcrypt = require('bcryptjs');

var User = require('../models/User');
var HttpError = require('../utils/HttpError');
var createToken = require('../utils/createToken');

function serializeUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

exports.registerUser = async function registerUser(input) {
  var existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    throw new HttpError(409, 'User already exists');
  }

  var passwordHash = await bcrypt.hash(input.password, 10);
  var user = await User.create({
    email: input.email,
    passwordHash: passwordHash,
    role: input.role || 'participant'
  });

  return {
    message: 'User registered',
    token: createToken(user),
    user: serializeUser(user)
  };
};

exports.loginUser = async function loginUser(input) {
  var user = await User.findOne({ email: input.email });
  var passwordMatches = user && await bcrypt.compare(input.password, user.passwordHash);

  if (!user || !passwordMatches) {
    throw new HttpError(401, 'Invalid credentials');
  }

  return {
    message: 'Login successful',
    token: createToken(user),
    user: serializeUser(user)
  };
};

exports.listUsers = async function listUsers() {
  var users = await User.find({}, 'email role createdAt').sort({ createdAt: -1 });

  return {
    users: users.map(serializeUser)
  };
};

exports.getUserById = async function getUserById(userId) {
  var user = await User.findById(userId);

  if (!user) {
    return null;
  }

  return serializeUser(user);
};
