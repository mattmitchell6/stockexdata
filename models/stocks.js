/**
 * Model for all stock data
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockSchema = new Schema({
  symbol: String,
  quote: {data: String, lastUpdated: Date},
  logoUrl: String,
  history: {data: String, lastUpdated: Date},
  news: {data: String, lastUpdated: Date},
  quarterlyResults: {incomeData: String, earningsData: String, lastReported: Date}
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
