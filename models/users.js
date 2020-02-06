const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-findorcreate')
// const PassportLocalMongoose = require('passport-local-mongoose');
// const ERROR = 'user already exists'
// mongoose.Promise = global.Promise; // to supress annoying warning

let userSchema = new Schema({
  googleId: String,
  name: String,
  watchlist: [String]
});

// userSchema.plugin(PassportLocalMongoose);
userSchema.plugin(findOrCreate);

var User = mongoose.model('User', userSchema);

module.exports = User;
