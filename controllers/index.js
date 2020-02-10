/**
 * Load all controllers
 */
const express = require('express');
const router = express.Router();
const moment = require('moment');
const passport = require('passport');
const User = require('../models/users');


const IEX = require('../service/iex/iex');
const Stock = require('../models/stocks');
const Company = require('../models/companies');
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/');


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
    // fetch data
    const stock = await IEX.getStockData(symbol);

    res.render('pages/displayStock', {
      info: stock.quote.data,
      quoteLastUpdated: stock.quote.lastUpdated,
      logoUrl: stock.logoUrl,
      keyStats: stock.keyStats.data,
      news: stock.news.data,
      displayNavSearch: true
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

router.get('/historicaldata', async function(req, res) {
  const symbol = req.query.symbol;
  let prices = [], dates = [];

  let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
  const history = JSON.parse(stock.history.data);
  const latestQuote = JSON.parse(stock.quote.data);

  try {
    // return appropriate date range values
    for(i=0; i < history.length; i++) {
      dates.push(history[i].date);
      prices.push(history[i].close);
    }

    // append most recent quote price
    if(moment(latestQuote.latestUpdate).isAfter(history[history.length - 1].date, 'day')) {
      dates.push(moment(latestQuote.latestUpdate).format("YYYY-MM-DD"))
      prices.push(latestQuote.latestPrice)
    }

    res.send({dates: dates, prices: prices});
  } catch(error) {
    console.log(error);
    res.send({status: 500, errorMessage: "Error in loading historical data"});
  }
})

router.get('/incomedata', async function(req, res) {
  const symbol = req.query.symbol;
  const type = req.query.type;
  let totalRevenueData = [], fiscalPeriods = [], netIncomeData = [];

  let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
  const quarterlyIncomeData = JSON.parse(stock.earningsResults.quarterlyIncomeData);
  const annualIncomeData = JSON.parse(stock.earningsResults.annualIncomeData);
  const earningsData = JSON.parse(stock.earningsResults.earningsData);

  try {

    if(earningsData || annualIncomeData || quarterlyIncomeData) {
      // return appropriate date range values
      if(type == 'quarterly') {
        for(i = 0; i < earningsData.length; i++) {
          fiscalPeriods.push(earningsData[i].fiscalPeriod);
          totalRevenueData.push(quarterlyIncomeData[i].totalRevenue);
          netIncomeData.push(quarterlyIncomeData[i].netIncome);
        }
      } else if(type == 'annual') {
        for(i = 0; i < annualIncomeData.length; i++) {
          fiscalPeriods.push(annualIncomeData[i].reportDate);
          totalRevenueData.push(annualIncomeData[i].totalRevenue);
          netIncomeData.push(annualIncomeData[i].netIncome);
        }
      } else {
        throw new Error('Range type mismatch')
      }

      res.send({
        fiscalPeriods: fiscalPeriods,
        totalRevenueData: totalRevenueData,
        earningsData: netIncomeData
      });
    } else {
      throw new Error('Data does not exist')
    }
  } catch(error) {
    console.log(error);
    res.send(false)
  }
})

// router.get('/earningsdata', async function(req, res) {
//   const symbol = req.query.symbol;
//   let earningsActual = [], fiscalPeriods = [], earningsEstimate = [];
//   const currentTime = moment();
//
//   let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
//   const earningsData = JSON.parse(stock.earningsResults.earningsData);
//
//   try {
//
//     if(earningsData) {
//       // return appropriate date range values
//       for(i=0; i < earningsData.length; i++) {
//         fiscalPeriods.push(earningsData[i].fiscalPeriod);
//         earningsActual.push(earningsData[i].actualEPS);
//         earningsEstimate.push(earningsData[i].consensusEPS);
//       }
//
//       res.send({
//         fiscalPeriods: fiscalPeriods,
//         earningsActual: earningsActual,
//         earningsEstimate: earningsEstimate
//       });
//     } else {
//       throw new Error('Data does not exist')
//     }
//   } catch(error) {
//     console.log(error);
//     res.send(false)
//   }
// })

/**
 * filter symbol search results
 */
router.get('/symbolfilter', async function(req, res) {
  const input = req.query.input;
  const searchResults = await Company.find({
    $or: [
      {symbol: {$regex: input, "$options": "i"}},
      {companyName: {$regex: input, "$options": "i"}}
    ]
  }).limit(7)
  res.send(searchResults);
});

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
 * add company to watchlist
 */
router.get('/watchlist/add/:symbol', async function(req, res) {
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
router.get('/watchlist/remove/:symbol', async function(req, res) {
  symbol = req.params.symbol;
  const filter = {_id: req.user._id};
  const update = {$pull: {watchlist: symbol}};

  let updatedUser = await User.findOneAndUpdate(filter, update, {new: true});
  req.session.passport.user = updatedUser

  res.redirect('/search?symbol=' + symbol)
})



/**
 * log in
 */
router.get('/auth/google', passport.authenticate('google', {scope: ['profile']}));

/**
 * log in
 */
// router.get('/auth/google/callback', passport.authenticate('google', {successRedirect: '/auth/google/success', failureRedirect: '/auth/google/failure'}), function(req, res) {
//   console.log("back in auth callback");
//   res.redirect('/')
// });

router.get('/auth/google/callback', passport.authenticate('google'), function(req, res) {
  res.redirect('/');
});

/**
 * logout clear session
 */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
