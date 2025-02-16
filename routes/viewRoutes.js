const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-bookings', authController.protect, viewController.myBookings);

router.use(authController.isLoggedIn);

router.get('/login', viewController.login);
router.get('/tour/:slug', viewController.getTour);

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

module.exports = router;
