const axios = require('axios');

const baseUrl = "https://cloud.iexapis.com/stable/stock/"
const token = `token=${process.env.IEX_TOKEN}`;

class IEX {
  static async getQuote(ticker) {
    const url = `${baseUrl}/${ticker}/quote?${token}`
    let result;

    result = await axios.get(url);

    // make call to fetch quote
    return result.data;
  }
}

module.exports = IEX;
