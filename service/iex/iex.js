/**
 * Class for making API calls to IEX
 */
const axios = require('axios');
const moment = require('moment');

const Stock = require('../../models/stocks');

const baseUrl = "https://cloud.iexapis.com/stable/stock"
const token = `token=${process.env.IEX_TOKEN}`;

const MAX_NEWS_SUMMARY = 200;

class IEX {

  /**
   * fetch all stock data
   */
  static async getStockData(symbol) {
    let quote, logoUrl, news, history, earningsResults, keyStats;
    let updateTasks = [], updateTaskResults = [], updateKeys = [], updates = {};
    const currentTime = moment();

    // fetch stock by symbol from db
    let stock = await Stock.findOne({'symbol': symbol.toUpperCase()});

    // does db entry for stock exist?
    if(stock) {
      console.log(`entry found for ${symbol}...`);

      // update news once a day
      if(currentTime.isAfter(stock.news.lastUpdated, 'day')) {
        updateTasks.push(getNews(symbol))
        updateKeys.push('news')
      }

      // update quote every 5 minutes
      if(currentTime.diff(stock.quote.lastUpdated, 'minutes') > 5) {
        updateTasks.push(getQuote(symbol))
        updateKeys.push('quote')
      }

      // update history once a day
      if(currentTime.isAfter(stock.history.lastUpdated, 'day')) {
        updateTasks.push(updateHistoricalPrices(symbol, currentTime, stock.history.lastUpdated, stock.history.data))
        updateKeys.push('history')
      }

      // update earnings results roughly once a quarter
      // TODO: there is definitely a better way of doing this
      if(currentTime.diff(stock.earningsResults.lastReported, 'days') > 90) {
        updateTasks.push(getEarningsResults(symbol));
        updateKeys.push('earningsResults')
      }

      // update key stats once a day
      if(!stock.keyStats || !stock.keyStats.data|| !stock.keyStats.lastUpdated || currentTime.isAfter(stock.keyStats.lastUpdated, 'day')) {
        updateTasks.push(getKeyStats(symbol));
        updateKeys.push('keyStats')
      }

      // if updates exist, save updates to db
      if(updateTasks.length > 0) {
        console.log("updating stock db entry...");
        updateTaskResults = await Promise.all(updateTasks)

        for(let i = 0; i < updateTaskResults.length; i++) {
          console.log(`updating ${updateKeys[i]}...`);
          updates[updateKeys[i]] = updateTaskResults[i]
        }

        stock = await Stock.findOneAndUpdate({'symbol': symbol.toUpperCase()}, updates, {new: true});
      }
    // no entry exists for this stock, create a new one
    } else {
      console.log(`entry not found for ${symbol}...`);

      // fetch stock info, logo, quarterly data, etc.
      [quote, logoUrl, news, history, earningsResults, keyStats] = await Promise.all([
        getQuote(symbol),
        getLogo(symbol),
        getNews(symbol),
        getHistoricalPrices(symbol, 'max'),
        getEarningsResults(symbol),
        getKeyStats(symbol)
      ]);

      // add new stock to db
      stock = new Stock({
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
 * fetch real-time price quote
 */
async function getQuote(symbol) {
  const url = `${baseUrl}/${symbol}/quote?${token}`

  // make call to fetch quote
  let result = await axios.get(url);
  result = result.data

  // calculate change
  result.dailyChange = dailyChange(result.latestPrice, result.previousClose)
  return {data: JSON.stringify(result), lastUpdated: moment()};
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
  return {data: JSON.stringify(result.data), lastUpdated: moment()}
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
    range = 'max';
  }

  // fetch daily stock prices based on calculated range above
  const url = `${baseUrl}/${symbol}/chart/${range}?${token}&chartInterval=1&chartCloseOnly=true`
  let result = await axios.get(url);

  // fill in daily price gaps
  let toAddDates = result.data.filter(function(day, index, arr) {
    return moment(day.date).isAfter(lastUpdated, 'day')
  });

  history = history.concat(toAddDates);

  return {data: JSON.stringify(history), lastUpdated: moment()};
}

 /**
  * fetch company news
  */
async function getNews(symbol) {
  const url = `${baseUrl}/${symbol}/news/last?${token}`

  // fetch last 10 news articles
  let result = await axios.get(url);

  // max out news summary character count at 100 chars
  for(i = 0; i < result.data.length; i++) {
    result.data[i].summary = result.data[i].summary.substr(0, MAX_NEWS_SUMMARY) + "...."
  }

  return {data: JSON.stringify(result.data), lastUpdated: moment()}
}

/**
 * fetch key stats
 */
async function getKeyStats(symbol) {
 const url = `${baseUrl}/${symbol}/stats?${token}`

 // fetch key stats
 let result = await axios.get(url);
 return {data: JSON.stringify(result.data), lastUpdated: moment()}
}

/**
 * fetch quarterly results
 */
async function getEarningsResults(symbol) {
  let quarterlyIncomeResult, annualIncomeResult, earningsResult;
  const quarterlyIncomeUrl = `${baseUrl}/${symbol}/income?last=4&period=quarter&${token}`;
  const annualIncomeUrl = `${baseUrl}/${symbol}/income?last=4&period=annual&${token}`;
  const earningsUrl = `${baseUrl}/${symbol}/earnings?last=4&${token}`;

  // make calls to fetch last 4 four quarters of income / earnings statements
  [quarterlyIncomeResult, annualIncomeResult, earningsResult] = await Promise.all([
    axios.get(quarterlyIncomeUrl),
    axios.get(annualIncomeUrl),
    axios.get(earningsUrl)
  ])

  if(!isEmpty(earningsResult.data) && !isEmpty(quarterlyIncomeResult.data) && !isEmpty(annualIncomeResult.data)) {
    quarterlyIncomeResult = quarterlyIncomeResult.data.income.reverse();
    annualIncomeResult = annualIncomeResult.data.income.reverse();
    earningsResult = earningsResult.data.earnings.reverse();

    return {
      quarterlyIncomeData: JSON.stringify(quarterlyIncomeResult),
      annualIncomeData: JSON.stringify(annualIncomeResult),
      earningsData: JSON.stringify(earningsResult),
      lastReported: earningsResult[earningsResult.length - 1].EPSReportDate
    }
  } else {
    return {
      quarterlyIncomeData: false,
      annualIncomeData: false,
      earningsData: false,
      lastReported: moment()
    }
  }
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
    keyStats: {
      data: JSON.parse(stock.keyStats.data),
      lastUpdated: stock.keyStats.lastUpdated
    },
    quote: {
      data: JSON.parse(stock.quote.data),
      lastUpdated: stock.quote.lastUpdated
    },
    news: {
      data: JSON.parse(stock.news.data),
      lastUpdated: stock.news.lastUpdated
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
