/**
 * Settings Controller
 */
const express = require('express');
const router = express.Router();
const User = require('../models/users');

/**
 * settings page
 */
router.get('/', async function (req, res) {
  res.render('pages/settings');
});

router.post('/configure', async function(req, res) {
  const config = req.body;

  req.session.config.checkout = config.checkout;
  req.flash('success', `Updated demo configuration` )
  res.redirect('/settings');
})

router.get('/reset-customer', async function (req, res) {
  const newStripeCustomer = await User.refreshStripeId(req.user._id, req.user.stripeCustomerId, req.user.username);

  req.user.stripeCustomerId = newStripeCustomer.stripeCustomerId;
  req.flash('success', `Created new user. Your customer ID is ${newStripeCustomer.stripeCustomerId}` )
  res.redirect('/settings')
});


module.exports = router;
