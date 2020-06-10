/**
 * Controller for fetching and sending quantitative stock data to charts
 */
const router = require('express').Router();
const moment = require('moment');

const Stock = require('../models/stocks');

/**
 * fetch historical stock quote data
 */
router.get('/historical', async function(req, res) {
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

/**
 * fetch company revenue data
 */
router.get('/income', async function(req, res) {
  const symbol = req.query.symbol;
  const type = req.query.type;
  let totalRevenueData = {quarterly: [], annual: []},
    fiscalPeriods = {quarterly: [], annual: []},
    netIncomeData = {quarterly: [], annual: []}

  let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});

  const quarterlyIncomeData = JSON.parse(stock.earningsResults.quarterlyIncomeData);
  const annualIncomeData = JSON.parse(stock.earningsResults.annualIncomeData);
  const earningsData = JSON.parse(stock.earningsResults.earningsData);

  try {
    for(i = 0; i < earningsData.length; i++) {
      fiscalPeriods.quarterly.push(earningsData[i].fiscalPeriod);
      totalRevenueData.quarterly.push(quarterlyIncomeData[i].totalRevenue);
      netIncomeData.quarterly.push(quarterlyIncomeData[i].netIncome);
    }

    for(i = 0; i < annualIncomeData.length; i++) {
      fiscalPeriods.annual.push(annualIncomeData[i].reportDate);
      totalRevenueData.annual.push(annualIncomeData[i].totalRevenue);
      netIncomeData.annual.push(annualIncomeData[i].netIncome);
    }

    res.send({
      fiscalPeriods: fiscalPeriods,
      totalRevenueData: totalRevenueData,
      earningsData: netIncomeData
    });
  } catch(error) {
    console.log(error);
    res.send(false)
  }
})

/**
 * fetch eps data
 */
router.get('/earnings', async function(req, res) {
  const symbol = req.query.symbol;
  let earningsActual = [], fiscalPeriods = [], earningsEstimate = [];
  const currentTime = moment();

  let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
  const earningsData = JSON.parse(stock.earningsResults.earningsData);

  try {

    if(earningsData) {
      // return appropriate date range values
      for(i = 0; i < earningsData.length; i++) {
        fiscalPeriods.push(earningsData[i].fiscalPeriod);
        earningsActual.push(earningsData[i].actualEPS);
        earningsEstimate.push(earningsData[i].consensusEPS);
      }

      res.send({
        fiscalPeriods: fiscalPeriods,
        earningsActual: earningsActual,
        earningsEstimate: earningsEstimate
      });
    } else {
      throw new Error('Data does not exist')
    }
  } catch(error) {
    console.log(error);
    res.send(false)
  }
})

module.exports = router;
