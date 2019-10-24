/**
 * Class for making API calls to IEX
 */
const axios = require('axios');

const baseUrl = "https://cloud.iexapis.com/stable/stock/"
const token = `token=${process.env.IEX_TOKEN}`;

class IEX {

  /**
   * fetch real-time price quote
   */
  static async getQuote(symbol) {
    const url = `${baseUrl}/${symbol}/quote?${token}`

    // make call to fetch quote
    let result = await axios.get(url);
    result = result.data

    // calculate change
    result.dailyChange = dailyChange(result.latestPrice, result.previousClose)


    return result;
  }

  /**
   * fetch company logo
   */
  static async getLogo(symbol) {
    const url = `${baseUrl}/${symbol}/logo?${token}`

    // make call to fetch logo
    let result = await axios.get(url);

    return result.data.url;
  }

  /**
   * fetch historical prices
   */
   static async getHistoricalPrices(symbol, interval) {
     const url = `${baseUrl}/${symbol}/chart/ytd?${token}&chartInterval=${interval}`

     // make call to fetch daily stock prices ytd
     let result = await axios.get(url);

     return result.data
   }
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
