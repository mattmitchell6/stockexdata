const express = require('express');
const favicon = require('serve-favicon');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const exphbs = require('express-handlebars')
const hbs = require('hbs')
const flash = require('connect-flash');
const session = require('express-session');
const mongoStore = require('connect-mongo')(session);
const handlebarsHelpers = require('./public/js/handlebars');
const fs = require("fs");
require('dotenv').config();
require('express-async-errors');

const strategy = require('./service/passport-google/passportStrategy.js');

// Create a new Express application.
let app = express();

// view engine setup (Handlebars)
app.set('view engine', 'hbs');
app.engine('hbs', exphbs({
  extname: '.hbs',
  helpers: handlebarsHelpers
}));
app.set('views','./views');

// register handlebars partials
hbs.registerPartials(__dirname + '/views/partials');

// Use application-level middleware for common functionality, including parsing, and session handling.
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'img/favicon.ico')))

// mongoose connect
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  useUnifiedTopology: true
 });

 app.use(session({
   store: new mongoStore({
     mongooseConnection: mongoose.connection,
     ttl: 60 * 24 * 60 * 60 // 60 days
   }),
   name: 'stock_ex_data',
   secret: 'unique-secret',
   resave: false,
   saveUninitialized: false
   // cookie: {maxAge: 30 * 86400 * 1000 } // 30 days
 }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// include recurring session metereds to route
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.success_message = req.flash('success');
  res.locals.error_message = req.flash('error');
  res.locals.layout = false
  next();
});

// load controllers & routes
app.use(require('./controllers'));

// error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.render('pages/error', { error: err});
});

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Getting served on port ' + PORT);
  }
});
