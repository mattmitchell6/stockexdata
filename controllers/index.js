/**
 * Load all controllers
 */
const express = require('express');
const router = express.Router();
const IEX = require('../service/iex/iex');
// const passport = require('passport');
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/');

// const User = require('../models/users');

// load routes
// router.use('/dashboard', ensureLoggedIn, require('./dashboard'))

/**
 * base route
 */
router.get('/', function(req, res) {
  // if (req.user) {
  //   res.redirect('/dashboard');
  // } else {
  //   res.render('pages/home');
  // }
  res.render('pages/home')
});

/**
 * search by symbol
 */
router.get('/search', async function(req, res) {
  const symbol = req.query.symbol;

  try {
    const info = await IEX.getQuote(symbol)
    const logoUrl = await IEX.getLogo(symbol)

    res.render('pages/quote', {
      info: info,
      logoUrl: logoUrl
    })
  } catch(error) {
    let errorMessage;
    if(error.response && error.response.status == 404) {
      errorMessage = `Could not find symbol "${symbol}"`;
    } else {
      throw new Error(error);
    }

    req.flash('error', errorMessage)
    res.redirect('/')
  }
})

/**
 * log in
 */
// router.post('/login', passport.authenticate('local', { failureRedirect: '/', failureFlash: true }), function(req, res) {
//   res.redirect('/');
// });

/**
 * sign up, create new user
 */
// router.post('/signup', async function(req, res) {
//   let userInfo = req.body;
//
//   // create new Stripe customer and db user
//   await User.newUser(userInfo);
//   console.log("Successfully created new user");
//
//   passport.authenticate('local') (req, res, function() {
//     res.redirect('/dashboard');
//   });
// });

/**
 * logout clear session
 */
// router.get('/logout', function(req, res) {
//   req.logout();
//   res.redirect('/');
// });

module.exports = router;
