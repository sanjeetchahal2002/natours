const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A user must have a name']
  },
  email: {
    type: String,
    trim: true,
    required: [true, 'A user must have a name'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a validate email'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'user', 'guide'],
    default: 'user'
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide password'],
    minLength: 8,
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: 'Please enter same as password'
    }
  },
  passwordChangedAt: Date,
  resetToken: String,
  resetTokenValidaty: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  loginAttempts: {
    type: Number,
    max: 5,
    default: 0
  },
  lockUntil: {
    type: Date
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // userPassword this we need beacuse we have select false in model for password
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.checkTokenAfterPasswordChange = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetTokenValidaty = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
