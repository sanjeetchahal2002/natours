/* eslint-disable */
import axios from 'axios';
const stripe = Stripe(
  'pk_test_51Qt3yHDgf8XK8DXLTgHijMZJYJKGqJL0uCuIOlrkcyXvO9hp9hqDJikRAKRCkqAmmLkt3V1fupGmM1klM2yXjuQ100IJ50leLZ'
);
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
