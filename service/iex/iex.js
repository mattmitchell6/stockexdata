/**
 * Class for making API calls to IEX
 */
const axios = require('axios');
const moment = require('moment');

const Stock = require('../../models/stocks');
const request = require('./request');

const baseUrl = "https://cloud.iexapis.com/stable/stock"
const token = `token=${process.env.IEX_TOKEN}`;

const MAX_NEWS_SUMMARY = 200;

class IEX {

  /**
   * fetch all stock data
   */
  static async getStockData(symbol) {
    let quote, logoUrl, news, history, earningsResults, keyStats, companyInfo;
    let updateTasks = [], updateTaskResults = [], updateKeys = [], updates = {};
    let nextEarningsDate;
    const currentTime = moment();

    // fetch stock by symbol from db
    let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});

    // does db entry for stock exist?
    if(stock) {
      console.log(`entry found for ${symbol}...`);

      // update news once a day
      if(currentTime.isAfter(stock.news.lastUpdated, 'day')) {
        updateTasks.push(request.news(symbol))
        updateKeys.push('news')
      }

      // update quote every 5 minutes
      if(currentTime.diff(stock.quote.lastUpdated, 'minutes') > 5) {
        updateTasks.push(request.quote(symbol))
        updateKeys.push('quote')
      }

      // update company info once a month
      if(currentTime.diff(stock.companyInfo.lastUpdated, 'months') > 1) {
        updateTasks.push(request.companyInfo(symbol))
        updateKeys.push('companyInfo')
      }

      // update history once a day
      if(currentTime.isAfter(stock.history.lastUpdated, 'day')) {
        updateTasks.push(updateHistoricalPrices(symbol, currentTime, stock.history.lastUpdated, stock.history.data))
        updateKeys.push('history')
      }

      // update earnings results roughly once a quarter
      nextEarningsDate = unStringify(stock).keyStats.nextEarningsDate;
      if(moment(nextEarningsDate).diff(stock.earningsResults.lastReported, 'days') > 150) {
        updateTasks.push(request.earningsResults(symbol));
        updateKeys.push('earningsResults')
      }

      // update key stats once a day
      if(!stock.keyStats || !stock.keyStats.data|| !stock.keyStats.lastUpdated || currentTime.isAfter(stock.keyStats.lastUpdated, 'day')) {
        updateTasks.push(request.keyStats(symbol));
        updateKeys.push('keyStats')
      }

      // if updates exist, save updates to db
      if(updateTasks.length > 0) {
        console.log("updating stock db entry...");
        updateTaskResults = await Promise.all(updateTasks)

        for(let i = 0; i < updateTaskResults.length; i++) {
          console.log(`updating ${symbol} ${updateKeys[i]}...`);
          updates[updateKeys[i]] = updateTaskResults[i]
        }

        stock = await Stock.findOneAndUpdate({'symbol': symbol.toUpperCase()}, updates, {new: true});
      }
    // no entry exists for this stock, create a new one
    } else {
      console.log(`entry not found for ${symbol}...`);

      // fetch stock info, logo, quarterly data, etc.
      [companyInfo, quote, logoUrl, news, history, earningsResults, keyStats] = await Promise.all([
        request.companyInfo(symbol),
        request.quote(symbol),
        request.logo(symbol),
        request.news(symbol),
        request.historicalPrices(symbol, 'max'),
        request.earningsResults(symbol),
        request.keyStats(symbol)
      ]);

      // add new stock to db
      stock = new Stock({
        companyInfo: companyInfo,
        symbol: symbol.toUpperCase(),
        quote: quote,
        keyStats: keyStats,
        logoUrl: logoUrl,
        history: history,
        news: news,
        earningsResults: earningsResults
      })
      await stock.save()
    }

    return unStringify(stock);
  }

  /**
   * fetch all IEX Symbols
   */
  static async getIEXSymbols() {
    const url = `https://cloud.iexapis.com/stable/ref-data/symbols?${token}`

    // make call to fetch all IEX symbols
    let result = await axios.get(url);
    result = result.data

    return result;
  }
}

/**
 * update historical prices
 */
async function updateHistoricalPrices(symbol, currentTime, lastUpdated, previousHistory) {
  let history = JSON.parse(previousHistory);
  let previousMostRecentQuote = history[history.length - 1];
  let range;

  // see how many historical stock quotes we've missed
  if(currentTime.diff(previousMostRecentQuote.date, 'days') <= 5) {
    range = '5d';
  } else if(currentTime.diff(previousMostRecentQuote.date, 'months') <= 1) {
    range = '1m';
  } else if(currentTime.diff(previousMostRecentQuote.date, 'months') <= 3) {
    range = '3m';
  } else if(currentTime.diff(previousMostRecentQuote.date, 'months') <= 6) {
    range = '6m';
  } else if(currentTime.diff(previousMostRecentQuote.date, 'years') <= 1) {
    range = '1y';
  } else if(currentTime.diff(previousMostRecentQuote.date, 'years') <= 2) {
    range = '2y';
  } else {
    range = 'max';
  }

  // fetch daily stock prices based on calculated range above
  const url = `${baseUrl}/${symbol}/chart/${range}?${token}&chartInterval=1&chartCloseOnly=true`
  let result = await axios.get(url);

  // fill in daily price gaps
  let toAddDates = result.data.filter(function(day, index, arr) {
    return moment(day.date).isAfter(previousMostRecentQuote.date, 'day')
  });

  history = history.concat(toAddDates);

  return {data: JSON.stringify(history), lastUpdated: moment()};
}


/**
 * calculate daily stock price change percentage
 */
function dailyChange(latestPrice, previousClose) {
  let change = latestPrice - previousClose
  let changePercent = (latestPrice * 100) / previousClose - 100;

  changePercent = changePercent.toFixed(2);
  change = change.toFixed(2);

  return {
    changePercent: changePercent,
    change: change
  }
}

/**
 * convert all stringified data entries to json
 */
function unStringify(stock) {
  return {
    symbol: stock.symbol,
    logoUrl: stock.logoUrl,
    companyInfo: JSON.parse(stock.companyInfo.data),
    keyStats: JSON.parse(stock.keyStats.data),
    quote: JSON.parse(stock.quote.data),
    quoteLastUpdated: stock.quote.lastUpdated,
    news: JSON.parse(stock.news.data)
  }
}

/**
 * is the object empty?
 */
function isEmpty(obj) {
  return Object.getOwnPropertyNames(obj).length === 0;
}


module.exports = IEX;
