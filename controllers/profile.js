/**
 * Controller to display user dashboard
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const Item = require('../models/items');

/**
 * Fetch app user token + info
 */
router.get('/', async function (req, res) {
  let stripeCustomerId = req.user.stripeCustomerId

  // fetch all available items
  const items = await Item.find()

  res.render('pages/profile', {
    user: req.user,
    items: items,
    stripeKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});


router.post('/charge', async function(req, res) {
  const token = req.body.stripeToken; // Using Express
  console.log(token);

  const charge = await stripe.charges.create({
    amount: 999,
    currency: 'usd',
    description: 'Example charge',
    source: token,
  });

  console.log(charge);

  res.redirect('/')
});


module.exports = router;
