const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const getToken = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOption = {
    expires: Date.now() + +process.env.JWT_COOKIE_EXPIRE_IN,
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);

  const { role, _id, name, email } = user;
  return res.status(statusCode).json({
    status: 'success',
    token,
    data: { role, _id, name, email }
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please loggin to get access', 401)
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currenUser = await User.findOne({ _id: decoded.id });
  if (!currenUser) {
    return next(
      new AppError('The User belonging to this token is no longer exists!', 401)
    );
  }
  if (currenUser.checkTokenAfterPasswordChange(decoded.iat)) {
    return next(new AppError('Invalid token password got changed!', 401));
  }
  req.user = currenUser;
  res.locals.user = currenUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have the premission to perform this action', 403)
      );
    }
    next();
  };
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (
    user.loginAttempts >= 5 &&
    user.lockUntil &&
    user.lockUntil > Date.now()
  ) {
    const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000);
    return next(
      new AppError(
        `Too many failed attempts. Try again after ${remainingTime} seconds.`,
        401
      )
    );
  }

  const isCorrect = await user.correctPassword(password, user.password);
  if (!isCorrect) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 3) {
      user.lockUntil = Date.now() + 1 * 60 * 1000;
    }

    await user.save({ validateBeforeSave: false });
    return next(new AppError('Incorrect email or password', 401));
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  getToken(user, 200, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  // in the below line we are directly adding value this can cause a security issues
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  const em = new Email(newUser, url);
  console.log('em', em);
  await em.sendWelcome();

  getToken(newUser, 201, res);
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email'));
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = req.params.token;

  const { password, passwordConfirm } = req.body;

  const encodedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne()
    .where({ resetToken: encodedToken })
    .where('resetTokenValidaty')
    .gt(Date.now());

  if (!user) {
    return next(new AppError('Invalid Token Please try again', 400));
  }
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.resetToken = undefined;
  user.resetTokenValidaty = undefined;

  await user.save();
  getToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newpassword, passwordConfirm } = req.body;

  const user = await User.findOne({ _id: req.user._id }).select('+password');
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Incorrect password ', 401));
  }
  if (currentPassword === newpassword) {
    return next(new AppError('Please provide a new password ', 400));
  }
  user.password = newpassword;
  user.passwordConfirm = passwordConfirm;

  await user.save();
  getToken(user, 200, res);
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET_KEY);

      const currenUser = await User.findOne({ _id: decoded.id });
      if (!currenUser) {
        next();
      }
      if (currenUser.checkTokenAfterPasswordChange(decoded.iat)) {
        next();
      }
      res.locals.user = currenUser;
      return next();
    } catch (err) {
      next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  return res.status(200).json({
    status: 'success'
  });
};
