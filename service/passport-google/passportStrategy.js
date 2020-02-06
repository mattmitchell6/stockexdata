const GoogleStrategy = require('passport-google-oauth2').Strategy;
const passport = require('passport');

const User = require('../../models/users');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `/auth/google/callback`,
  passReqToCallback: true
},
function(request, accessToken, refreshToken, profile, done) {
  User.findOrCreate({googleId: profile.id, name: profile.displayName}, function (err, user) {
    return done(err, user);
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
