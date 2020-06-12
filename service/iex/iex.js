/**
 * Class for making API calls to IEX and organizing data
 */
const axios = require('axios');
const moment = require('moment');

const Stock = require('../../models/stocks');
const request = require('./request');

const token = `token=${process.env.IEX_TOKEN}`;

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
        updateTasks.push(request.updateHistoricalPrices(symbol, currentTime, stock.history.lastUpdated, stock.history.data))
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

module.exports = IEX;
