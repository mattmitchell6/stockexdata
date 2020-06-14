/**
 * Load all controllers
 */
const router = require('express').Router();

const Stock = require('../models/stocks');
const User = require('../models/users');
const Company = require('../models/companies');
const IEX = require('../service/iex/iex');
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/');


// load routes
router.use('/watchlist', require('./watchlist'))
router.use('/auth', require('./auth'))
router.use('/data', require('./stockData'))

/**
 * base route
 */
router.get('/', async function(req, res) {
  let watchlist, user;

  // if user is logged in and has items in watchlist
  if(req.user && req.user.watchlist.length > 0) {
    user = await User.findOne({'_id': req.user._id});
    watchlist = user.watchlist;
  }

  res.render('pages/home', {
    watchlist: watchlist
  })
});

/**
 * lookup company by symbol
 */
router.get('/:symbol', async function(req, res) {
  const symbol = req.params.symbol;

  try {
    // fetch data
    const stock = await IEX.getStockData(symbol);
    res.render('pages/displayStock', {
      stock: stock,
      displayNavSearch: true
    })
  } catch(error) {
    let errorMessage;
    if(error.response && error.response.status == 404) {
      errorMessage = `Could not find symbol "${symbol}"`;
    } else {
      console.log(error);
      throw new Error(error);
    }

    req.flash('error', errorMessage)
    res.redirect('/')
  }
});

/**
 * fetch stock by symbol
 */
router.get('/fetch/:symbol', async function(req, res) {
  const symbol = req.params.symbol;
  const stock = await IEX.getStockData(symbol);

  res.json(stock)
});

/**
 * fetch all companies for filtering
 */
router.get('/filter/allcompanies', async function(req, res) {
  const allCompanies = await Company.find({})
  res.send(allCompanies);
});


/**
 * workaround for removing symbol db entry
 */
router.get("/delete/:symbol", async function(req, res) {
  const symbol = req.params.symbol;
  const confirm = req.query.confirm

  if(confirm == "true") {
    await Stock.findOne({'symbol': symbol.toUpperCase()}).deleteOne();
    console.log(symbol + " removed...");
  }

  res.redirect('/')
})

module.exports = router;
