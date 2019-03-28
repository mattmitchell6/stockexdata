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
  const stripeId = req.user.stripeCustomerId
  let lineItems;
  let subscriptions;
  let subscriptionItemId;

  // fetch current subscriptions
  subscriptions = await stripe.subscriptions.list({
    customer: stripeId
  });

  // fetch usage
  if(subscriptions.data && subscriptions.data.length > 0) {
    lineItems = await stripe.invoices.retrieveLines("upcoming", {
      customer: stripeId
    })
    subscriptionItemId = subscriptions.data[0].items.data[0].id
  }

  res.render('pages/dashboard', {
    user: req.user,
    subscription: subscriptions.data && subscriptions.data.length > 0 ? subscriptions.data[0] : null,
    subscriptionItemId: subscriptionItemId,
    lineItems: lineItems ? lineItems.data[0] : null,
    success_message: req.flash('success')
    // stripeKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});


router.get('/use/:subscription/:quantity', async function(req, res) {
  const usageRecord = await stripe.usageRecords.create(req.params.subscription, {
    quantity: req.params.quantity,
    timestamp: Date.now() / 1000 | 0
  });

  req.flash('success', `Successfully used ${req.params.quantity} units` )

  res.redirect('/dashboard')
})

module.exports = router;
