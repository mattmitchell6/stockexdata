/**
 * Controller to display subscription options
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
const availablePlans = require('../stripeBillingPlans.json')
const TRIAL_DAYS = 7;
const TRIAL_CODE = "FREETRIAL"
// const DISCOUNT_CODE = "3OFF"

/**
 * main route for rendering subscription page
 */
router.get('/', async function (req, res) {
  const stripeId = req.user.stripeCustomerId;
  let lineItems, upcomingInvoice, currentPlanId;

  // fetch customer, available plans, charge history
  const [customer, invoices] = await Promise.all([
    stripe.customers.retrieve(stripeId, {expand: ["default_source"]}),
    stripe.charges.list({customer: stripeId})
  ]);

  // fetch upcoming invoice if subscription exists
  if(customer.subscriptions.data && customer.subscriptions.data.length > 0) {
    upcomingInvoice = await stripe.invoices.retrieveUpcoming("upcoming", {
      customer: stripeId
    })
    // fetch active licensed plan id
    customer.subscriptions.data[0].items.data.forEach((item) => {
      if(item.plan.usage_type == "licensed") {
        currentPlanId = item.plan.id
      }
    })
    customer.default_source.brand = customer.default_source.brand.toLowerCase();
  }

  res.render('pages/subscription', {
    subscription: customer.subscriptions.data ? customer.subscriptions.data[0] : null,
    customer: customer,
    upcomingInvoice: upcomingInvoice,
    plans: availablePlans,
    currentPlanId: currentPlanId,
    invoices: invoices ? invoices.data : null
  });
});

/**
 * create subscription
 */
router.post('/subscribe', async function(req, res) {
  try {
    const plan = availablePlans.find((plan) => plan.id == req.body.plan)
    let promoCode = req.body.promoCode;
    promoCode ? promoCode = promoCode.toUpperCase() : null;

    const customer = await stripe.customers.update(req.user.stripeCustomerId, {
      source: req.body.stripeToken
    });

    // set subscription options with optional trial / coupon arguments
    let subOptions = {
      customer: customer.id,
      items: [
        { plan: plan.licensed, },
        { plan: plan.metered, }
      ]}

    // populate discount code or free trial in subscription options object
    promoCode && promoCode != TRIAL_CODE ? subOptions.coupon = promoCode : null;
    promoCode == TRIAL_CODE ? subOptions.trial_period_days = TRIAL_DAYS : null;

    const subscription = await stripe.subscriptions.create(subOptions);

    req.flash('success', `Successfully subscribed! Your subscription ID is ${subscription.id}`)
    res.redirect('/subscription');
  } catch(error) {
    console.log(error.raw);
    req.flash('error', `${error.message}` )
    res.redirect(`/subscription/create-subscription/${plan.id}`);
  }
});

/**
 * update subscription plans
 */
router.get('/update-subscription/:newPlan/:oldSubId', async function(req, res) {
  let existingLicensedPlan, existingMeteredSub;
  const plan = availablePlans.find((plan) => plan.id == req.params.newPlan)

  // fetch 'to update' subscription items
  const subscription = await stripe.subscriptions.retrieve(req.params.oldSubId);
  subscription.items.data.forEach((item) => {
    if(item.plan.usage_type == "metered") {
      existingMeteredSub = item.id
    } else if(item.plan.usage_type == "licensed") {
      existingLicensedPlan = item.id
    }
  })

   // update subscription with new plan
   const updatedSubscription = await stripe.subscriptions.update(req.params.oldSubId, {
     billing_cycle_anchor: "now",
     trial_end: "now",
     items: [
       { id: existingLicensedPlan, plan: plan.licensed },
       { id: existingMeteredSub, plan: plan.mereted }]
   })

   req.flash('success', `Successfully updated to '${plan.nickname}'!`)
   res.redirect('/subscription')
 })

/**
 * cancel subscription
 */
router.post('/cancel-subscription', async function(req, res) {
  const deletedSubscription = await stripe.subscriptions.del(req.body.subscription, {
    invoice_now: true
  })

  // pay if there's unpaid metered usage on the invoice
  await stripe.invoices.pay(deletedSubscription.latest_invoice)

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

  try {
    const customer = await stripe.customers.update(req.user.stripeCustomerId, {
      source: token
    });
    req.flash('success', `Successfully updated payment method!` )
    res.redirect('/subscription')
  } catch(error) {
    req.flash('error', `${error.message}` )
    res.redirect('/subscription/update-payment')
  }
})

/**
 * navigate to 'create subscription' page
 */
router.get('/create-subscription/:id', async function(req, res) {
  const plan = availablePlans.find((plan) => plan.id == req.params.id)

  res.render('pages/payment-subscribe', {
    plan: plan
  })
})

/**
 * set up Stripe Checkout 'session' TODO: when checkout supports metered plans
 */
router.get('/setup-checkout', async function(req, res) {
  let plan = await stripe.plans.retrieve(req.query.id);
  console.log(plan);
  const meteredPlan = await stripe.plans.retrieve(plan.metadata.meteredPlan);
  const stripeId = req.user.stripeCustomerId;

  const session = await stripe.checkout.sessions.create({
    success_url: "http://localhost:3000/successful-subscription",
    cancel_url: "http://localhost:3000/cancel",
    customer: stripeId,
    payment_method_types: ["card"],
    subscription_data: {
      items: [{
        plan: plan.id
      }]
    }
  });

  res.JSON(session)
})

module.exports = router;
