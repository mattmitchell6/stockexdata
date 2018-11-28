const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PassportLocalMongoose = require('passport-local-mongoose');
const ERROR = 'user already exists'
// mongoose.Promise = global.Promise; // to supress annoying warning

let userSchema = new Schema({
  username: String,
  password: String,
  stripeCustomerId: String
});

userSchema.plugin(PassportLocalMongoose);

/**
 * Create new app user and add user to database
 */
userSchema.statics.newUser = async function (user) {
  let dbUser;
  let newStripeUser;
  let username = user.username;

  // check if user with submitted name exists
  dbUser = await User.findOne({username: username});
  if(dbUser) {
    throw new Error(ERROR);
  }

  // add new user to database
  return new Promise((resolve, reject) => {
    User.register(
      new User({username: user.username}), user.password, function(err, user) {
      if (err) { reject(err); }
      else { resolve(user); }
    });
  });
}

var User = mongoose.model('User', userSchema);

module.exports = User;
