/**
 * Controller to display user dashboard
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');

/**
 * main route for rendering items and previous charges page
 */
router.get('/', async function (req, res) {
  const stripeCustomerId = req.user.stripeCustomerId

  // fetch current subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId
  });

  res.render('pages/dashboard', {
    user: req.user,
    subscription: subscriptions.data ? subscriptions.data[0] : null
    // stripeKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

module.exports = router;
