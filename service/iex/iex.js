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
    let stock = await Stock.findOne({'symbol': symbol});
    const currentTime = moment();
    console.log(stock);
    console.log(currentTime);

    if(stock) {
      console.log('entry found...');

      // update news once a day
      // if(stock.news.lastUpdated)

    // no entry exists for this symbol, create a new one
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
    return stock;
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

module.exports = IEX;
