/**
 * Load all controllers
 */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/');

const User = require('../models/users');

// load routes
router.use('/dashboard', ensureLoggedIn, require('./dashboard'))
router.use('/subscription', ensureLoggedIn, require('./subscription'))
router.use('/settings', ensureLoggedIn, require('./settings'))

/**
 * base route
 */
router.get('/', function(req, res) {
  // initialize configuration obj
  req.session.config = {
    checkout: "custom"
  }

  if (req.user) {
    res.redirect('/dashboard');
  } else {
    res.render('pages/home', {
      error_message: req.flash('error')
    });
  }
});

/**
 * log in
 */
router.post('/login', passport.authenticate('local', { failureRedirect: '/' }), function(req, res) {
  res.redirect('/');
});

/**
 * sign up, create new user
 */
router.post('/signup', async function(req, res) {
  let userInfo = req.body;

  // create new Stripe customer and db user
  await User.newUser(userInfo);
  console.log("Successfully created new user");

  passport.authenticate('local') (req, res, function() {
    res.redirect('/dashboard');
  });
});

/**
 * logout clear session
 */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
