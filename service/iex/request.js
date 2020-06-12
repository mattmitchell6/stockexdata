/**
 * Helper class for sending requests to IEX
 */
const axios = require('axios');
const moment = require('moment');

const baseUrl = "https://cloud.iexapis.com/stable/stock"
const token = `token=${process.env.IEX_TOKEN}`;

const MAX_NEWS_SUMMARY = 200;

class request {

  /**
   * fetch real-time price quote
   */
  static async quote(symbol) {
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
  static async logo(symbol) {
    const url = `${baseUrl}/${symbol}/logo?${token}`

    // make call to fetch logo
    let result = await axios.get(url);
    return result.data.url;
  }

  /**
   * fetch company info
   */
  static async companyInfo(symbol) {
    const url = `${baseUrl}/${symbol}/company?${token}`

    // make call to fetch company info
    let result = await axios.get(url);
    result = result.data

    return {data: JSON.stringify(result), lastUpdated: moment()};
  }

  /**
   * fetch historical prices
   */
  static async historicalPrices(symbol, range) {
    const url = `${baseUrl}/${symbol}/chart/${range}?${token}&chartInterval=1&chartCloseOnly=true`

    // fetch daily stock prices ytd
    let result = await axios.get(url);
    return {data: JSON.stringify(result.data), lastUpdated: moment()}
  }

   /**
    * fetch company news
    */
  static async news(symbol) {
    const url = `${baseUrl}/${symbol}/news/last?${token}`

    // fetch last 10 news articles
    let result = await axios.get(url);

    // max out news summary character count at 100 chars
    for(let i = 0; i < result.data.length; i++) {
      result.data[i].summary = result.data[i].summary.substr(0, MAX_NEWS_SUMMARY) + "..."
    }

    return {data: JSON.stringify(result.data), lastUpdated: moment()}
  }

  /**
   * fetch key stats
   */
  static async keyStats(symbol) {
   const url = `${baseUrl}/${symbol}/stats?${token}`

   // fetch key stats
   let result = await axios.get(url);
   return {data: JSON.stringify(result.data), lastUpdated: moment()}
  }

  /**
   * fetch quarterly results
   */
  static async earningsResults(symbol) {
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
   * update historical prices
   */
  static async updateHistoricalPrices(symbol, currentTime, lastUpdated, previousHistory) {
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
 * is the object empty?
 */
function isEmpty(obj) {
  return Object.getOwnPropertyNames(obj).length === 0;
}


module.exports = request;
