/**
 * Class for making API calls to IEX
 */
const axios = require('axios');
const moment = require('moment');

const Stock = require('../../models/stocks');

const baseUrl = "https://cloud.iexapis.com/stable/stock/"
const token = `token=${process.env.IEX_TOKEN}`;
const rangeInterval = {
  '1m': 1,
  '6m': 1,
  'ytd': 1,
  '1y': 1,
  '5y': 7
  // 'max': 7
}

class IEX {

  /**
   * fetch all stock data
   */
  static async getStockData(symbol) {
    let quote, logoUrl, news, history;
    let updates = {};
    const currentTime = moment();
    let stock = await Stock.findOne({'symbol': symbol});

    // does db entry for stock exist?
    if(stock) {
      console.log('entry found...');

      // update news once a day
      if(currentTime.diff(stock.news.lastUpdated, 'days') >= 0) {
        console.log("diff in news updated...");
        console.log(currentTime.diff(stock.news.lastUpdated, 'days'));

        news = await getNews(symbol)
        updates.news = {data: news, lastUpdated: currentTime}
      }

      // update quote once every 30 minutes
      if(currentTime.diff(stock.quote.lastUpdated, 'minutes') > 30) {
        console.log("diff in quote updated...");
        console.log(currentTime.diff(stock.quote.lastUpdated, 'minutes'));

        quote = await getQuote(symbol)
        updates.quote = {data: quote, lastUpdated: currentTime}
      }

      // update history once a day
      if(currentTime.diff(stock.history.lastUpdated, 'days') >= 1) {
        console.log("diff in history updated...");
        console.log(currentTime.diff(stock.history.lastUpdated, 'days'));
      }

      // if updates exist, save updates to db
      if(!isEmpty(updates)) {
        console.log("updating stock db entry...");
        await Stock.updateOne({'symbol': symbol}, updates);
        stock = await Stock.findOne({'symbol': symbol});
      }
    // no entry exists for this stock, create a new one
    } else {
      // fetch stock info, logo, etc.
      [quote, logoUrl, news, history] = await Promise.all([
        getQuote(symbol),
        getLogo(symbol),
        getNews(symbol),
        getHistoricalPrices(symbol)
      ]);

      // store stock information
      stock = new Stock({
        symbol: symbol,
        quote: {data: quote, lastUpdated: currentTime},
        logoUrl: logoUrl,
        history: {data: history, lastUpdated: currentTime},
        news: {data: news, lastUpdated: currentTime}
      })
      await stock.save()
    }


    return unStringify(stock);
  }
}

/**
 * fetch real-time price quote
 */
async function getQuote(symbol) {
  const url = `${baseUrl}/${symbol}/quote?${token}`

  // make call to fetch quote
  let result = await axios.get(url);
  result = result.data

  // calculate change
  result.dailyChange = dailyChange(result.latestPrice, result.previousClose)

  return JSON.stringify(result);
}

/**
 * fetch company logo
 */
async function getLogo(symbol) {
  const url = `${baseUrl}/${symbol}/logo?${token}`

  // make call to fetch logo
  let result = await axios.get(url);

  return result.data.url;
}

/**
 * fetch historical prices
 */
async function getHistoricalPrices(symbol, range) {
  const url = `${baseUrl}/${symbol}/chart/1m?${token}&chartInterval=1&chartCloseOnly=true`

  // make call to fetch daily stock prices ytd
  let result = await axios.get(url);

  return JSON.stringify(result.data)
}

 /**
  * fetch company news
  */
async function getNews(symbol) {
  const url = `${baseUrl}/${symbol}/news/last?${token}`

  // make call to fetch last 10 news articles
  let result = await axios.get(url);

  return JSON.stringify(result.data)
}

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

function unStringify(stock) {
  return {
    symbol: stock.symbol,
    logoUrl: stock.logoUrl,
    quote: {
      data: JSON.parse(stock.quote.data),
      lastUpdated: stock.quote.lastUpdated
    },
    news: {
      data: JSON.parse(stock.news.data),
      lastUpdated: stock.news.lastUpdated
    },
    history: {
      data: JSON.parse(stock.history.data),
      lastUpdated: stock.history.lastUpdated
    }
  }
}

function isEmpty(obj) {
  return Object.getOwnPropertyNames(obj).length === 0;
}

module.exports = IEX;
