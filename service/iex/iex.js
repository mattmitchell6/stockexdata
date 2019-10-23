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

    return result.data;
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
}

module.exports = IEX;
