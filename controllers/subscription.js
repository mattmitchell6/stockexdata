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
  const stripeId = req.user.stripeCustomerId;
  let defaultCard = null;
  let lineItems;

  // fetch customer subscriptions, customer info, and available plans
  const [subscriptions, customer, plans, invoices] = await Promise.all([
    stripe.subscriptions.list({customer: stripeId}),
    stripe.customers.retrieve(stripeId),
    stripe.plans.list({product: process.env.PRODUCT_ID}),
    stripe.charges.list({customer: stripeId})
  ])

  // fetch customer card info
  if(customer.default_source) {
    defaultCard = await stripe.customers.retrieveCard(stripeId, customer.default_source);
  }

  // fetch upcoming invoice if metered usage
  if(subscriptions.data[0] && subscriptions.data[0].plan.usage_type) {
    lineItems = await stripe.invoices.retrieveLines("upcoming", {
      customer: stripeId
    })
  }

  res.render('pages/subscription', {
    user: req.user,
    subscription: subscriptions.data ? subscriptions.data[0] : null,
    card: defaultCard,
    lineItems: lineItems ? lineItems.data[0] : null,
    plans: plans.data,
    config: req.session.config,
    invoices: invoices ? invoices.data : null,
    stripeKey: process.env.STRIPE_PUBLISHABLE_KEY,
    success_message: req.flash('success'),
    error_message: req.flash('error')
  });
});

/**
 * create subscription
 */
router.post('/subscribe', async function(req, res) {

  // TODO: some error handling to determine if subscription already exists

  try {
    const customer = await stripe.customers.update(req.user.stripeCustomerId, {
      source: req.body.stripeToken
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          plan: req.body.plan,
        }
      ]});

    req.flash('success', `Successfully subscribed! ${subscription.id}`)
    res.redirect('/subscription');
  } catch(error) {
    console.log(error.raw);
    req.flash('error', `${error.message}` )
    res.redirect(`/subscription/create-subscription/${req.body.plan}`);
  }
});

/**
 * cancel subscription
 */
router.post('/cancel-subscription', async function(req, res) {
  const deletedSubscription = await stripe.subscriptions.del(req.body.subscription)

  res.redirect('/subscription')
})

// update payment - get
router.get('/update-payment', async function (req, res) {
  res.render('pages/payment-update', {
    user: req.user
  })
})

// update payment - post
router.post('/update-payment', async function(req, res) {
  const token = req.body.stripeToken;

  const customer = await stripe.customers.update(req.user.stripeCustomerId, {
    source: token
  });
  req.flash('success', `Successfully updated payment method!` )

  res.redirect('/subscription')
})

// create subscriptions
router.get('/create-subscription/:id', async function(req, res) {
  const plan = await stripe.plans.retrieve(req.params.id)

  res.render('pages/payment-subscribe', {
    user: req.user,
    plan: plan,
    error_message: req.flash('error')
  })
})

module.exports = router;
