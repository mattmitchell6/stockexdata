const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// mongoose.Promise = global.Promise; // to supress annoying warning

let itemSchema = new Schema({
  name: String,
  imageUrl: String,
  cost: Number,
  currency: String
});

/**
 * Create new item and add to database
 */
// itemSchema.statics.newItem = function (name, imageUrl, cost) {
//
//   // add new item to database
//   new Item({name: name, imageUrl: imageUrl, cost: cost}) function(err, item) {
//     if (err) { reject(err); }
//     else { resolve(user); }
//   });
// }

var Item = mongoose.model('Item', itemSchema);

module.exports = Item;
