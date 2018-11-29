/**
 * Controller to display user dashboard
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const Item = require('../models/items');

/**
 * main route for rendering items and previous charges page
 */
router.get('/', async function (req, res) {
  const stripeCustomerId = req.user.stripeCustomerId
  const purchase = {
    total: req.query.amount,
    id: req.query.tid,
    description: req.query.description
  }

  // fetch all available items
  const items = await Item.find()

  // fetch all previous customer purchases, limit 20
  const previousCharges = await stripe.charges.list({
    limit: 20,
    customer: stripeCustomerId
  });

  res.render('pages/profile', {
    user: req.user,
    items: items,
    charges: previousCharges.data,
    purchase: purchase.total ? purchase : null,
    stripeKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});


/**
 * tally up costs and send charge to stripe
 */
router.post('/charge', async function(req, res) {
  const token = req.body.stripeToken; // Using Express
  const itemIds = req.body.itemIds;
  const stripeCustomerId = req.user.stripeCustomerId
  let currentItem;
  let totalCost = 0;
  let description = "";

  // tally up total cost and add item names to description
  // determine if there is 1 item or multiple items in checkout cart
  if(itemIds instanceof Array) {
    for(let i = 0; i < itemIds.length; i++) {
      currentItem = await Item.findById(itemIds[i]);
      totalCost += currentItem.price;

      if(description.length == 0) {
        description = currentItem.name
      } else {
        description += ", " + currentItem.name;
      }
    }
  } else {
    currentItem = await Item.findById(itemIds);
    description = currentItem.name;
    totalCost += currentItem.price;
  }

  // link card source with customer
  // I know, a bit hacky to update the customer source every time. Wanted a quick
  // and dirty way to tie charges to a customer's account.
  // With more time, a custom UI component would probably accompany this functionality
  // to prompt a user as to whether or not they'd like to "save their inputted card"
  // or use a previous card
  const customer = await stripe.customers.update(stripeCustomerId, {
    source: token
  });

  // create charge
  const charge = await stripe.charges.create({
    amount: totalCost,
    currency: 'usd',
    description: description,
    source: customer.default_source,
    customer: stripeCustomerId
  });

  res.redirect('/profile?amount=' + charge.amount + '&tid=' + charge.id + "&description=" + charge.description)
});


module.exports = router;
