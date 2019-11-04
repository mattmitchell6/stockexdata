/**
 * Load all controllers
 */
const express = require('express');
const router = express.Router();
const moment = require('moment');

const IEX = require('../service/iex/iex');
const Stock = require('../models/stocks');
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
    // fetch data
    const stock = await IEX.getStockData(symbol);

    res.render('pages/displayStock', {
      info: stock.quote.data,
      quoteLastUpdated: stock.quote.lastUpdated,
      logoUrl: stock.logoUrl,
      // history: stock.history.data,
      news: stock.news.data
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

router.get('/historicaldata', async function(req, res) {
  const symbol = req.query.symbol;
  const range = req.query.range;
  let prices = [], dates = [], dateLimit;
  const currentTime = moment();

  let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
  const history = JSON.parse(stock.history.data);
  const latestQuote = JSON.parse(stock.quote.data);

  // fetch date limit
  switch(range) {
    case '1m':
      dateLimit = currentTime.subtract({'months': 1})
      break;
    case '6m':
      dateLimit = currentTime.subtract({'months': 6})
      break;
    case '1y':
      dateLimit = currentTime.subtract({'years': 1})
      break;
    case '5y':
      dateLimit = currentTime.subtract({'years': 5})
      break;
    case 'ytd':
      dateLimit = moment().startOf('year');
      break;
    default:
      dateLimit = moment().startOf('year')
  }

  try {

    // return appropriate date range values
    for(i=0; i < history.length; i++) {
      if(dateLimit.isSameOrBefore(history[i].date, 'day')) {
        if(range != '5y') {
          dates.push(history[i].date);
          prices.push(history[i].close);
        } else if(!(i % 5)) {
          dates.push(history[i].date);
          prices.push(history[i].close);
        }
      }
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
  let totalRevenueData = [], fiscalPeriods = [], netIncomeData = [];
  const currentTime = moment();

  let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
  const incomeData = JSON.parse(stock.quarterlyResults.incomeData);
  const earningsData = JSON.parse(stock.quarterlyResults.earningsData);
  // console.log(earningsData);
  // console.log(incomeData);

  try {

    // return appropriate date range values
    for(i=0; i < incomeData.length; i++) {
      fiscalPeriods.push(earningsData[i].fiscalPeriod);
      totalRevenueData.push(incomeData[i].totalRevenue);
      netIncomeData.push(incomeData[i].netIncome);
    }

    res.send({
      fiscalPeriods: fiscalPeriods,
      totalRevenueData: totalRevenueData,
      earningsData: netIncomeData
    });
  } catch(error) {
    console.log(error);
    res.send({status: 500, errorMessage: "Error in loading historical data"});
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
