/**
 * Controller to display subscription options
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');

/**
 * main route for rendering items and previous charges page
 */
router.get('/', async function (req, res) {

  // fetch current subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: req.user.stripeCustomerId
  });
  console.log(subscriptions);

  // fetch all plans for generic product
  const plans = await stripe.plans.list({
    product: process.env.PRODUCT_ID
  });

  res.render('pages/subscriptions', {
    user: req.user,
    subscription: subscriptions.data ? subscriptions.data[0].plan.nickname : "none",
    plans: plans.data,
    stripeKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

router.post('/subscribe', async function(req, res) {

  const customer = await stripe.customers.update(req.user.stripeCustomerId, {
    source: req.body.stripeToken
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      {
        plan: req.body.plan,
      }
    ]})

  console.log(subscription);
  res.redirect('/dashboard');
})

module.exports = router;
