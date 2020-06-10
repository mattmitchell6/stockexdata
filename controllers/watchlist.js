/**
 * Controller for company watchlist
 */
const router = require('express').Router();

const User = require('../models/users');

/**
 * add company to watchlist
 */
router.get('/add/:symbol', async function(req, res) {
  symbol = req.params.symbol;
  const filter = {_id: req.user._id};
  const update = {$push: {watchlist: symbol}};

  let updatedUser = await User.findOneAndUpdate(filter, update, {new: true});
  req.session.passport.user = updatedUser

  res.redirect('/search?symbol=' + symbol)
});

/**
 * remove company from watchlist
 */
router.get('/remove/:symbol', async function(req, res) {
  symbol = req.params.symbol;
  const filter = {_id: req.user._id};
  const update = {$pull: {watchlist: symbol}};

  let updatedUser = await User.findOneAndUpdate(filter, update, {new: true});
  req.session.passport.user = updatedUser

  res.redirect('/search?symbol=' + symbol)
})

module.exports = router;
