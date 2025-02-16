const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  const newErr = new AppError(message, 400);
  return newErr;
};

const handleDuplicateFieldsDB = err => {
  const { keyValue } = err;
  const message = `Duplicate field value: ${
    Object.keys(keyValue)[0]
  }. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTExpiredTokenError = () => {
  return new AppError('Token got expired Please Login Again', 401);
};

const handleJWTInvalidTokenError = () => {
  return new AppError('Invalid token Please Login Again', 401);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    res.status(err.statusCode).render('error', {
      msg: err
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  } else if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      msg: err.message
    });
  } else {
    res.status(err.statusCode).render('error', {
      msg: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredTokenError();
    if (err.name === 'JsonWebTokenError') error = handleJWTInvalidTokenError();

    sendErrorProd(error, req, res);
  }
};
