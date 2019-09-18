/**
 * Controller to display subscription options
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
const TRIAL_DAYS = 7;

/**
 * main route for rendering subscription page
 */
router.get('/', async function (req, res) {
  const stripeId = req.user.stripeCustomerId;
  let lineItems;
  let upcomingInvoice;
  let currentPlanId;

  // fetch customer, available plans, charge history
  const [customer, allPlans, invoices] = await Promise.all([
    stripe.customers.retrieve(stripeId, {expand: ["default_source"]}),
    stripe.plans.list({active: true}),
    stripe.charges.list({customer: stripeId})
  ]);

  // populate 'base' plans with their respective metered plans
  let basePlans = allPlans.data.filter(plan => plan.usage_type == "licensed");
  let meteredPlans = allPlans.data.filter(plan => plan.usage_type == "metered");
  basePlans.forEach((basePlan) => {
    let metered = meteredPlans.filter(meteredPlan => basePlan.product == meteredPlan.product)
    basePlan.metered = metered[0];
  });
  basePlans = basePlans.sort((a, b) => (a.amount > b.amount) ? 1 : -1) // sort by plan amount

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
    plans: basePlans,
    currentPlanId: currentPlanId,
    invoices: invoices ? invoices.data : null
  });
});

/**
 * create subscription
 */
router.post('/subscribe', async function(req, res) {
  try {
    const coupon = req.body.coupon;
    const trial = req.body.trial;

    const customer = await stripe.customers.update(req.user.stripeCustomerId, {
      source: req.body.stripeToken
    });

    // set subscription options with optional trial / coupon arguments
    let subOptions = {
      customer: customer.id,
      items: [
        { plan: req.body.basePlanId, },
        { plan: req.body.meteredPlanId, }
      ]}
    coupon ? subOptions.coupon = coupon.toUpperCase() : null;
    trial ? subOptions.trial_period_days = TRIAL_DAYS : null;

    const subscription = await stripe.subscriptions.create(subOptions);

    req.flash('success', `Successfully subscribed! Your subscription ID is ${subscription.id}`)
    res.redirect('/subscription');
  } catch(error) {
    console.log(error.raw);
    req.flash('error', `${error.message}` )
    res.redirect(`/subscription/create-subscription/${req.body.basePlanId}`);
  }
});

/**
 * update subscription plan
 */
router.get('/update-subscription/:newPlanId/:oldSubId', async function(req, res) {
  let baseSub, meteredSub, basePlan, meteredPlan;

  // fetch 'to update' plans
  basePlan = await stripe.plans.retrieve(req.params.newPlanId)
  meteredPlan = basePlan.metadata.meteredPlan;

  // fetch 'to update' subscription items
  const subscription = await stripe.subscriptions.retrieve(req.params.oldSubId);
  subscription.items.data.forEach((item) => {
    if(item.plan.usage_type == "metered") {
      meteredSub = item.id
    } else if(item.plan.usage_type == "licensed") {
      baseSub = item.id
    }
  })

   // update subscription with new plan
   const updatedSubscription = await stripe.subscriptions.update(req.params.oldSubId, {
     billing_cycle_anchor: "now",
     trial_end: "now",
     items: [
       { id: baseSub, plan: basePlan.id },
       { id: meteredSub, plan: meteredPlan }]
   })

   req.flash('success', `Successfully updated to '${basePlan.nickname}'!`)
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
  let plan = await stripe.plans.retrieve(req.params.id)
  const meteredPlan = await stripe.plans.retrieve(plan.metadata.meteredPlan);
  plan.metered = meteredPlan;

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
