/**
 * Controller to display subscription options
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');

/**
 * main route for rendering subscription page
 */
router.get('/', async function (req, res) {
  const stripeId = req.user.stripeCustomerId;
  let lineItems;

  // fetch customer, available plans, charge history
  const [customer, plans, invoices] = await Promise.all([
    stripe.customers.retrieve(stripeId, {expand: ["default_source", "subscriptions"]}),
    stripe.plans.list({product: process.env.PRODUCT_ID}),
    stripe.charges.list({customer: stripeId})
  ])

  // fetch upcoming invoice if metered usage
  if(customer.subscriptions.data[0] && customer.subscriptions.data[0].plan.usage_type) {
    lineItems = await stripe.invoices.retrieveLines("upcoming", {
      customer: stripeId
    })
  }

  res.render('pages/subscription', {
    subscription: customer.subscriptions.data ? customer.subscriptions.data[0] : null,
    defaultCard: customer.default_source ? customer.default_source : null,
    lineItems: lineItems ? lineItems.data[0] : null,
    plans: plans.data,
    invoices: invoices ? invoices.data : null
  });
});

/**
 * create subscription
 */
router.post('/subscribe', async function(req, res) {

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
 * update subscription plan
 */
 router.get('/update-subscription/:newPlanId/:subId', async function(req, res) {
   // fetch current subscription item
   const subscription = await stripe.subscriptions.retrieve(req.params.subId);
   const subItemId = await subscription.items.data[0].id;

   try {
     // update subscription with new plan
     const updatedSubscription = await stripe.subscriptions.update(req.params.subId, {
      items: [{
          id: subItemId, plan: req.params.newPlanId
      }]
     })

     req.flash('success', `Successfully updated to '${updatedSubscription.plan.nickname}'!`)
   } catch(e) {
     const deletedSubscription = await stripe.subscriptions.del(req.params.subId);

     const newSubscription = await stripe.subscriptions.create({
       customer: req.user.stripeCustomerId,
       items: [
         {
           plan: req.params.newPlanId,
         }
       ]});
     req.flash('success', `Reset plan to '${newSubscription.plan.nickname}'!`)
   }

   res.redirect('/subscription')
 })

/**
 * cancel subscription
 */
router.post('/cancel-subscription', async function(req, res) {
  const deletedSubscription = await stripe.subscriptions.del(req.body.subscription)

  req.flash('success', `Subscription successfully cancelled`)
  res.redirect('/subscription')
})

/**
 * navigate to update 'payment method' page
 */
router.get('/update-payment', async function (req, res) {
  res.render('pages/payment-update')
})

/**
 * update payment method
 */
router.post('/update-payment', async function(req, res) {
  const token = req.body.stripeToken;

  const customer = await stripe.customers.update(req.user.stripeCustomerId, {
    source: token
  });
  req.flash('success', `Successfully updated payment method!` )

  res.redirect('/subscription')
})

/**
 * navigate to 'create subscription' page
 */
router.get('/create-subscription/:id', async function(req, res) {
  const plan = await stripe.plans.retrieve(req.params.id)

  res.render('pages/payment-subscribe', {
    plan: plan
  })
})

module.exports = router;
