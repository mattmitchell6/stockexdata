/**
 * Controller for company watchlist
 */
const router = require('express').Router();

const User = require('../models/users');
const IEX = require('../service/iex/iex');

/**
 * add company to watchlist
 */
router.get('/add/:symbol', async function(req, res) {
  symbol = req.params.symbol;
  const filter = {_id: req.user._id};
  const update = {$push: {watchlist: symbol}};

  let updatedUser = await User.findOneAndUpdate(filter, update, {new: true});
  req.session.passport.user = updatedUser

  res.redirect('/' + symbol)
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

  res.redirect('/' + symbol)
})

/**
 * quick watchlist stock lookup
 */
router.get('/fetch/:symbol', async function(req, res) {
  const symbol = req.params.symbol;
  const stock = await IEX.getStockData(symbol);

  res.json(stock)
});

module.exports = router;
