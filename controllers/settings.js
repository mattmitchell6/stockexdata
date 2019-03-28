/**
 * Settings Controller
 */
const express = require('express');
const router = express.Router();

/**
 * main route for rendering items and previous charges page
 */
router.get('/', async function (req, res) {
  const stripeCustomerId = req.user.stripeCustomerId

  if(!req.session.config) {
    req.session.config = {
      checkout: "custom"
    }
  }

  res.render('pages/settings', {
    user: req.user,
    config: req.session.config,
    success_message: req.flash('success')
  });
});

router.post('/configure', async function(req, res) {
  const config = req.body;

  req.session.config.checkout = config.checkout;

  req.flash('success', `Updated demo configuration` )

  res.redirect('/settings');
})

router.get('/reset-customer/:id', async function (req, res) {
  const stripeCustomerId = req.params.id

  res.redirect('/settings')
});


module.exports = router;
