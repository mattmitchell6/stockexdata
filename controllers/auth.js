/**
 * Controller for user authentication
 */
const router = require('express').Router();
const passport = require('passport');

/**
 * log with Google
 */
router.get('/google', passport.authenticate('google', {scope: ['profile']}));

/**
 * Google callback
 */
router.get('/google/callback', passport.authenticate('google'), function(req, res) {
  let path = req.headers.referer.split('/')
  path = "/" + path[path.length - 1];

  res.redirect(path)
});

/**
 * logout, clear session
 */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
