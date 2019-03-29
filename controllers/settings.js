/**
 * Settings Controller
 */
const express = require('express');
const router = express.Router();
const User = require('../models/users');

/**
 * main route for rendering items and previous charges page
 */
router.get('/', async function (req, res) {

  if(!req.session.config) {
    req.session.config = {
      checkout: "custom"
    }
  }

  res.render('pages/settings', {
    user: req.user,
    config: req.session.config,
    success_message: req.flash('success')
  });
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
  req.flash('success', `Created new user with id, ${newStripeCustomer.stripeCustomerId}` )

  res.redirect('/settings')
});


module.exports = router;
