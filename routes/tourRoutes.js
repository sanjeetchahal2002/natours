const express = require('express');

const tourController = require('../controllers/tourContoller');
const authController = require('../controllers/authController');
const reviewRoute = require('./reviewRoutes');

const router = express.Router();

// router.param(':id', tourController.checkId);

router.use('/:tourId/reviews', reviewRoute);

router
  .route('/top-5-cheap')
  .get(tourController.getAliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStatics);
router.route('/tour-by-year/:year').get(tourController.getTourByYear);
router.route('/').get(tourController.getAllTours);
router.route('/:id').get(tourController.getTour);
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

router.use(authController.protect);

router.route('/').post(tourController.createNewTour);
router
  .route('/:id')
  .patch(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
