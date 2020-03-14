/**
 * Load all controllers
 */
const express = require('express');
const router = express.Router();
const moment = require('moment');

const Stock = require('../models/stocks');
const Company = require('../models/companies');
const IEX = require('../service/iex/iex');
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/');


// load routes
router.use('/watchlist', require('./watchlist'))
router.use('/auth', require('./auth'))

/**
 * base route
 */
router.get('/', async function(req, res) {
  let watchlist, stock;
  let watchlistQuotes = [], watchlistTasks = []

  // if user is logged in and has items in watchlist, fetch quotes
  if(req.user && req.user.watchlist.length > 0) {
    watchlist = req.user.watchlist;

    for(let i = 0; i < watchlist.length; i++) {
      watchlistTasks.push(IEX.getStockData(watchlist[i]))
    }
    watchlistQuotes = await Promise.all(watchlistTasks)
  }

  res.render('pages/home', {
    watchlist: watchlistQuotes
  })
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
      quote: stock.quote.data,
      info: stock.companyInfo.data,
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

module.exports = router;
