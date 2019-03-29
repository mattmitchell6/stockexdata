const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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

  // create new Stripe customer
  newStripeUser = await stripe.customers.create({email: user.username});

  // add new user to database
  return new Promise((resolve, reject) => {
    User.register(
      new User({username: user.username, stripeCustomerId: newStripeUser.id}), user.password, function(err, user) {
      if (err) { reject(err); }
      else { resolve(user); }
    });
  });
}

userSchema.statics.refreshStripeId = async function(_id, stripeId, username) {
  //fetch user
  dbUser = await User.findOne({stripeCustomerId: stripeId});

  // delete old stripe customer
  await stripe.customers.del(stripeId);

  // create new Stripe customer
  newStripeCustomer = await stripe.customers.create({email: username});

  return new Promise((resolve, reject) => {
    User.findByIdAndUpdate(_id, {stripeCustomerId: newStripeCustomer.id}, {new: true}, function(err, user) {
      if (err) { reject(err); }
      else { resolve(user); }
    });
  });

}

var User = mongoose.model('User', userSchema);

module.exports = User;
