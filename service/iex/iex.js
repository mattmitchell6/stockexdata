/**
 * Class for making API calls to IEX
 */
const axios = require('axios');
const moment = require('moment');

const Stock = require('../../models/stocks');

const baseUrl = "https://cloud.iexapis.com/stable/stock/"
const token = `token=${process.env.IEX_TOKEN}`;

class IEX {

  /**
   * fetch all stock data
   */
  static async getStockData(symbol) {
    let quote, logoUrl, news, history;
    let updates = {};
    const currentTime = moment();
    let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});

    // does db entry for stock exist?
    if(stock) {
      console.log(`entry found for ${symbol}...`);

      // update news once a day
      if(currentTime.isAfter(stock.news.lastUpdated, 'day')) {
        console.log("updating news...");
        news = await getNews(symbol)
        updates.news = {data: news, lastUpdated: currentTime}
      }

      // update quote once every 30 minutes
      if(currentTime.diff(stock.quote.lastUpdated, 'minutes') > 10) {
        console.log("updating stock quote...");
        quote = await getQuote(symbol)
        updates.quote = {data: quote, lastUpdated: currentTime}
      }

      // update history once a day
      if(currentTime.isAfter(stock.history.lastUpdated, 'day')) {
        console.log("updating historical quotes...");
        history = await updateHistoricalPrices(symbol, currentTime, stock.history.lastUpdated, stock.history.data)
        updates.history = {data: history, lastUpdated: currentTime}
      }

      // if updates exist, save updates to db
      if(!isEmpty(updates)) {
        console.log("updating stock db entry...");
        await Stock.updateOne({'symbol': symbol.toUpperCase()}, updates);
        stock = await Stock.findOne({'symbol': symbol.toUpperCase()});
      }
    // no entry exists for this stock, create a new one
    } else {
      console.log(`entry not found for ${symbol}...`);

      // fetch stock info, logo, etc.
      [quote, logoUrl, news, history] = await Promise.all([
        getQuote(symbol),
        getLogo(symbol),
        getNews(symbol),
        getHistoricalPrices(symbol, '5y')
      ]);

      // add new stock to db
      stock = new Stock({
        symbol: symbol.toUpperCase(),
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
  const url = `${baseUrl}/${symbol}/chart/${range}?${token}&chartInterval=1&chartCloseOnly=true`

  // fetch daily stock prices ytd
  let result = await axios.get(url);
  return JSON.stringify(result.data)
}

/**
 * update historical prices
 */
async function updateHistoricalPrices(symbol, currentTime, lastUpdated, previousHistory) {
  let history = JSON.parse(previousHistory);
  let range;

  // see how many historical stock quotes we've missed
  if(currentTime.diff(lastUpdated, 'days') <= 5) {
    range = '5d';
  } else if(currentTime.diff(lastUpdated, 'months') <= 1) {
    range = '1m';
  } else if(currentTime.diff(lastUpdated, 'months') <= 3) {
    range = '3m';
  } else if(currentTime.diff(lastUpdated, 'months') <= 6) {
    range = '6m';
  } else if(currentTime.diff(lastUpdated, 'years') <= 1) {
    range = '1y';
  } else if(currentTime.diff(lastUpdated, 'years') <= 2) {
    range = '2y';
  } else {
    range = '5y';
  }

  // fetch daily stock prices based on calculated range above
  const url = `${baseUrl}/${symbol}/chart/${range}?${token}&chartInterval=1&chartCloseOnly=true`
  let result = await axios.get(url);

  // fill in daily price gaps
  let toAddDates = result.data.filter(function(day, index, arr) {
    return moment(day.date).isAfter(lastUpdated, 'day')
  });
  console.log(toAddDates);

  history = history.concat(toAddDates)

  return JSON.stringify(history);
}

 /**
  * fetch company news
  */
async function getNews(symbol) {
  const url = `${baseUrl}/${symbol}/news/last?${token}`

  // fetch last 10 news articles
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

/**
 * convert all stringified data entries to json
 */
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

/**
 * is the object empty?
 */
function isEmpty(obj) {
  return Object.getOwnPropertyNames(obj).length === 0;
}

module.exports = IEX;
