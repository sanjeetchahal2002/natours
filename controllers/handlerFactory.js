const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apifeatures');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    });
  });

exports.getOne = (Model, popObject) =>
  catchAsync(async (req, res, next) => {
    //params : conditional Param   /api/v1/tours/:id/:l?
    let query = await Model.findById(req.params.id);
    if (popObject) {
      query = query.populate(popObject);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    const filterObj = {};
    if (req.params.tourId) filterObj.tour = req.params.tourId;

    const apiFeatures = new APIFeatures(Model.find(filterObj), req.query)
      .filter()
      .sort()
      .limitField()
      .pagination();

    const tours = await apiFeatures.query;

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      result: tours.length,
      data: {
        tours
      }
    });
  });
