/**
 * Controller to display user dashboard
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
// const multer = require('multer')
// const upload = multer({ dest: 'temp/' })

// const BoxSdk = require('../service/box/boxSdk');

/**
 * Fetch app user token + info
 */
router.get('/', async function (req, res) {
  // let stripeCustomerId = req.user.stripeCustomerId

  res.render('pages/profile', {
    user: req.user
  });
});


module.exports = router;
