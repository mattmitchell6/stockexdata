/**
 * Model for stock symbol lookup data
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let companiesSchema = new Schema({
  symbol: String,
  companyName: String
});

const Company = mongoose.model('Company', companiesSchema);

module.exports = Company;
