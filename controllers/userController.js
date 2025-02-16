const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');
const helperUtils = require('../utils/helperUtils');
const factory = require('./handlerFactory');

// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'public/img/users');
//   },
//   filename: function(req, file, cb) {
//     const ext = file.mimetype.split('/')[1];
//     const uniqueSuffix = ` user-${req.user.id}-${Date.now()}.${ext}`;
//     cb(null, uniqueSuffix);
//   }
// });
const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  }
  cb(new AppError('Not an image! Please upload only image'), false);
};

const upload = multer({ storage: storage, fileFilter: multerFilter });

exports.uploadProfilePhoto = upload.single('photo');

exports.resizeProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating password. please use /updatePassword',
        400
      )
    );
  }
  const filterdBody = helperUtils.filterObj(req.body, 'name', 'email');

  if (req.file) {
    filterdBody.photo = req.file.filename;
  }

  const user = await User.findByIdAndUpdate(
    { _id: req.user._id },
    filterdBody,
    {
      new: true,
      runValidators: true
    }
  ).select(
    '-password, -passwordChangedAt, -resetToken, -resetTokenValidaty, -passwordChangedAt'
  );

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate({ _id: req.user._id }, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet! Please use /sign-up'
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User);
