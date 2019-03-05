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
  const stripeId = req.user.stripeCustomerId

  // fetch customer subscriptions, customer info, and available plans
  const [subscriptions, customer, plans] = await Promise.all([
    stripe.subscriptions.list({customer: stripeId}),
    stripe.customers.retrieve(stripeId),
    stripe.plans.list({product: process.env.PRODUCT_ID})
  ])

  // fetch customer card info
  const defaultCard = await stripe.customers.retrieveCard(stripeId, customer.default_source);

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
