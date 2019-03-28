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
    config: req.session.config
  });
});

router.post('/', async function(req, res) {


})

router.get('/reset-customer/:id', async function (req, res) {
  const stripeCustomerId = req.params.id

  res.redirect('/settings')
});


module.exports = router;
