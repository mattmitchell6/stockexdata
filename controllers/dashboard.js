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
  let upcomingInvoice;
  let subscription;
  let subscriptionItemId;

  // fetch current subscriptions
  subscription = await stripe.subscriptions.list({
    customer: stripeId
  });

  // fetch usage, metered subscription id
  if(subscription.data && subscription.data.length > 0) {
    upcomingInvoice = await stripe.invoices.retrieveUpcoming("upcoming", {
      customer: stripeId
    })

    // fetch "metered" subscription item
    subscription.data[0].items.data.forEach((item) => {
      if(item.plan.usage_type == "metered") {
        subscriptionItemId = item.id;
      }
    })
  }

  res.render('pages/dashboard', {
    subscription: subscription.data && subscription.data.length > 0 ? subscription.data[0] : null,
    subscriptionItemId: subscriptionItemId,
    upcomingInvoice: upcomingInvoice
  });
});


router.get('/use/:subscription/:quantity', async function(req, res) {

  // will fail if currently subscribed to 'licensed plan'
  try {
    const usageRecord = await stripe.usageRecords.create(req.params.subscription, {
      quantity: req.params.quantity,
      timestamp: Date.now() / 1000 | 0
    });
  } catch(error) {
    console.log('caught error: ' + error.message);
  }

  req.flash('success', `Successfully used ${req.params.quantity} unit(s)` )
  res.redirect('/dashboard')
});

module.exports = router;
