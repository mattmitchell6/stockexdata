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

  // fetch customer info
  const customer = await stripe.customers.retrieve(req.user.stripeCustomerId)
  const defaultCard = await stripe.customers.retrieveCard(
    req.user.stripeCustomerId, customer.default_source);
  console.log(defaultCard);

  // fetch all plans for generic product
  const plans = await stripe.plans.list({
    product: process.env.PRODUCT_ID
  });

  res.render('pages/subscriptions', {
    user: req.user,
    subscription: subscriptions.data ? subscriptions.data[0] : null,
    card: defaultCard,
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

  res.redirect('/subscriptions');
});

router.post('/cancel-subscription', async function(req, res) {
  const deletedSubscription = await stripe.subscriptions.del(req.body.subscription)

  res.redirect('/subscriptions')
})

module.exports = router;
