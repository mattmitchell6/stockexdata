/**
 * Model for stock symbol lookup data
 */
const mongoose = require('mongoose');
const fuzzySearching = require('mongoose-fuzzy-searching');

const Schema = mongoose.Schema;

let companiesSchema = new Schema({
  symbol: String,
  companyName: String
});

companiesSchema.plugin(fuzzySearching, {fields: ['symbol', 'companyName']});

const Company = mongoose.model('Company', companiesSchema);

module.exports = Company;
