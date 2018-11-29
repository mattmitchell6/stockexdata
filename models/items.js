const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// mongoose.Promise = global.Promise; // to supress annoying warning

let itemSchema = new Schema({
  name: String,
  imageUrl: String,
  price: Number,
  currency: String
});

var Item = mongoose.model('Item', itemSchema);

module.exports = Item;
