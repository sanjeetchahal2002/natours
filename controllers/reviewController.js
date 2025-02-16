const Review = require('../models/reviewModel');

const helperUtils = require('../utils/helperUtils');
const factory = require('./handlerFactory');

exports.setTourAndUserIds = (req, res, next) => {
  const filterdFields = helperUtils.filterObj(req.body, 'review', 'rating');
  filterdFields.user = req.user._id;
  filterdFields.tour = req.params.tourId;
  req.body = filterdFields;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
