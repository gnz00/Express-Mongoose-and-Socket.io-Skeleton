require("source-map-support").install();
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

  __webpack_require__(19);
  module.exports = __webpack_require__(16);


/***/ },
/* 1 */
/***/ function(module, exports) {

  module.exports = require("express");

/***/ },
/* 2 */
/***/ function(module, exports) {

  module.exports = require("events");

/***/ },
/* 3 */
/***/ function(module, exports) {

  module.exports = require("lodash");

/***/ },
/* 4 */
/***/ function(module, exports) {

  module.exports = require("mongoose");

/***/ },
/* 5 */
/***/ function(module, exports) {

  'use strict';
  
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  /**
   * Login Required middleware.
   */
  
  // Extensions to request
  var requestExtensions = exports.requestExtensions = function requestExtensions(req, res, next) {
    req.login = function (user) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  
      req['session']['user'] = user;
    };
    req.logout = function () {
      delete req['session']['user'];
    };
    req.isAuthenticated = function () {
      return req['session']['user'] ? true : false;
    };
    next();
  };
  
  // Route middleware
  var isAuthenticated = exports.isAuthenticated = function isAuthenticated(req, res, next) {
    // Is the user authenticated?
    if (req.isAuthenticated()) {
      // Does the user have enhanced security enabled?
      if (req.session.user.enhancedSecurity.enabled) {
        // If we already have validated the second factor it's
        // a noop, otherwise redirect to capture the OTP.
        if (req.session.passport.secondFactor === 'validated') {
          return next();
        } else {
          // Verify their OTP code
          res.redirect('/verify-setup');
        }
      } else {
        // If enhanced security is disabled just continue.
        return next();
      }
    } else {
      req.session.attemptedURL = req.url; // Save URL so we can redirect to it after authentication
      res.set('X-Auth-Required', 'true');
      req.flash('error', { msg: 'You must be logged in to reach that page.' });
      res.redirect('/login');
    }
  };
  
  /**
   * Authorization Required middleware.
   */
  
  var isAuthorized = exports.isAuthorized = function isAuthorized(req, res, next) {
    var provider = req.path.split('/').slice(-1)[0];
    if (_.find(req.session.user.tokens, { kind: provider })) {
      // we found the provider so just continue
      next();
    } else {
      // we have to get authorized first
      if (provider === 'facebook' || provider === 'twitter' || provider === 'github' || provider === 'google') {
        req.flash('info', { msg: 'You must connect ' + utils.capitalize(provider) + ' first!' });
        res.redirect('/account');
      } else {
        res.redirect('/auth/' + provider);
      }
    }
  };
  
  /**
   * Check if the account is an Administrator
   */
  
  var isAdministrator = exports.isAdministrator = function isAdministrator(req, res, next) {
    // make sure we are logged in first
    if (req.isAuthenticated()) {
      // user must be be an administrator
      if (req.session.user.type !== 'admin') {
        req.flash('error', { msg: 'You must be an Administrator reach that page.' });
        return res.redirect('/api');
      } else {
        return next();
      }
    } else {
      req.flash('error', { msg: 'You must be logged in to reach that page.' });
      res.redirect('/login');
    }
  };
  
  /**
   * Redirect to HTTPS (SSL) connection
   *
   * Good middleware for login forms, etc.
   * Not currently used since we are directing
   * *all* traffic to ssl in production
   */
  
  var isSecure = exports.isSecure = function isSecure(req, res, next) {
    // Reroute HTTP traffic to HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    } else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  };

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

  'use strict'
  
  /**
   * Module Dependencies
   */
  
  ;
  
  var _mongoose = __webpack_require__(4);
  
  var _mongoose2 = _interopRequireDefault(_mongoose);
  
  var _bluebird = __webpack_require__(21);
  
  var _bluebird2 = _interopRequireDefault(_bluebird);
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  
  var bcrypt = __webpack_require__(20);
  var crypto = __webpack_require__(8);
  
  var mongoose = _bluebird2.default.promisifyAll(_mongoose2.default);
  
  /**
   * Define User Schema
   */
  
  var userSchema = new mongoose.Schema({
  
    email: { type: String, unique: true, index: true },
    password: { type: String },
    type: { type: String, default: 'user' },
  
    facebook: { type: String, unique: true, sparse: true },
    twitter: { type: String, unique: true, sparse: true },
    google: { type: String, unique: true, sparse: true },
    github: { type: String, unique: true, sparse: true },
    tokens: Array,
  
    profile: {
      name: { type: String, default: '' },
      gender: { type: String, default: '' },
      location: { type: String, default: '' },
      website: { type: String, default: '' },
      picture: { type: String, default: '' },
      phone: {
        work: { type: String, default: '' },
        home: { type: String, default: '' },
        mobile: { type: String, default: '' }
      }
    },
  
    activity: {
      date_established: { type: Date, default: Date.now },
      last_logon: { type: Date, default: Date.now },
      last_updated: { type: Date }
    },
  
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  
    verified: { type: Boolean, default: true },
    verifyToken: { type: String },
  
    enhancedSecurity: {
      enabled: { type: Boolean, default: false },
      type: { type: String }, // sms or totp
      token: { type: String },
      period: { type: Number },
      sms: { type: String },
      smsExpires: { type: Date }
    }
  
  });
  
  /**
   * Hash the password and sms token for security.
   */
  
  userSchema.pre('save', function (next) {
  
    var user = this;
    var SALT_FACTOR = 5;
  
    if (!user.isModified('password')) {
      return next();
    } else {
      bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
        if (err) {
          return next(err);
        }
        bcrypt.hash(user.password, salt, null, function (err, hash) {
          if (err) {
            return next(err);
          }
          user.password = hash;
          next();
        });
      });
    }
  });
  
  /**
   * Check the user's password
   */
  
  userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  };
  
  /**
   * Check user's SMS token
   */
  
  userSchema.methods.compareSMS = function (candidateSMS, cb) {
    bcrypt.compare(candidateSMS, this.enhancedSecurity.sms, function (err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  };
  
  /**
   *  Get a URL to a user's Gravatar email.
   */
  
  userSchema.methods.gravatar = function (size, defaults) {
    if (!size) {
      size = 200;
    }
    if (!defaults) {
      defaults = 'retro';
    }
    if (!this.email) {
      return 'https://gravatar.com/avatar/?s=' + size + '&d=' + defaults;
    }
    var md5 = crypto.createHash('md5').update(this.email);
    return 'https://gravatar.com/avatar/' + md5.digest('hex').toString() + '?s=' + size + '&d=' + defaults;
  };
  
  module.exports = mongoose.model('User', userSchema);

/***/ },
/* 7 */
/***/ function(module, exports) {

  module.exports = require("async");

/***/ },
/* 8 */
/***/ function(module, exports) {

  module.exports = require("crypto");

/***/ },
/* 9 */
/***/ function(module, exports) {

  module.exports = require("debug");

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

  'use strict'
  
  /**
   * Module Dependencies
   */
  
  ;
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _express = __webpack_require__(1);
  
  var _auth = __webpack_require__(5);
  
  var _ = __webpack_require__(3);
  var Twit = __webpack_require__(54);
  var async = __webpack_require__(7);
  var debug = __webpack_require__(9)('skeleton'); // https://github.com/visionmedia/debug
  var graph = __webpack_require__(32);
  var tumblr = __webpack_require__(53);
  var Github = __webpack_require__(34);
  var paypal = __webpack_require__(46);
  var cheerio = __webpack_require__(23); // https://github.com/cheeriojs/cheerio
  var request = __webpack_require__(49); // https://github.com/mikeal/request
  var LastFmNode = __webpack_require__(39).LastFmNode;
  var querystring = __webpack_require__(48);
  
  /**
   * API Controller
   */
  var router = new _express.Router();
  
  /**
   * GET /api*
   * *ALL* api routes must be authenticated first
   */
  
  router.all('/api*', _auth.isAuthenticated);
  
  /**
   * GET /api
   * List of API examples.
   */
  
  router.get('/api', function (req, res) {
    res.render('api/index', {
      url: req.url
    });
  });
  
  /**
   * GET /api/react
   * React examples
   */
  
  router.get('/api/react', function (req, res) {
    res.render('api/react', {
      url: req.url
    });
  });
  
  /**
   * GET /creditcard
   * Credit Card Form Example.
   */
  
  router.get('/api/creditcard', function (req, res) {
    res.render('api/creditcard', {
      url: req.url
    });
  });
  
  /**
   * GET /api/lastfm
   * Last.fm API example.
   */
  
  router.get('/api/lastfm', function (req, res, next) {
    var lastfm = new LastFmNode(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).lastfm);
    async.parallel({
  
      artistInfo: function artistInfo(done) {
        lastfm.request('artist.getInfo', {
          artist: 'Morcheeba',
          handlers: {
            success: function success(data) {
              done(null, data);
            },
            error: function error(err) {
              done(err);
            }
          }
        });
      },
  
      artistTopAlbums: function artistTopAlbums(done) {
        lastfm.request('artist.getTopAlbums', {
          artist: 'Morcheeba',
          handlers: {
            success: function success(data) {
              var albums = [];
              _.forEach(data.topalbums.album, function (album) {
                albums.push(album.image.slice(-1)[0]['#text']);
              });
              done(null, albums.slice(0, 4));
            },
            error: function error(err) {
              done(err);
            }
          }
        });
      }
    }, function (err, results) {
      if (err) {
        return next(err.message);
      }
      var artist = {
        name: results.artistInfo.artist.name,
        image: results.artistInfo.artist.image.slice(-1)[0]['#text'],
        tags: results.artistInfo.artist.tags.tag,
        bio: results.artistInfo.artist.bio.summary,
        stats: results.artistInfo.artist.stats,
        similar: results.artistInfo.artist.similar.artist,
        topAlbums: results.artistTopAlbums
      };
      res.render('api/lastfm', {
        artist: artist,
        url: '/apiopen'
      });
    });
  });
  
  /**
   * GET /api/nyt
   * New York Times API example.
   */
  
  router.get('/api/nyt', function (req, res, next) {
    var query = querystring.stringify({ 'api-key': ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).nyt.key, 'list-name': 'young-adult' });
    var url = 'http://api.nytimes.com/svc/books/v2/lists?' + query;
    request.get(url, function (error, request, body) {
      if (request.statusCode === 403) {
        return next(error('Missing or Invalid New York Times API Key'));
      }
      var bestsellers = {};
      // NYT occasionally sends bad data :(
      try {
        bestsellers = JSON.parse(body);
      } catch (err) {
        bestsellers.results = '';
        req.flash('error', { msg: err.message });
      }
      res.render('api/nyt', {
        url: '/apiopen',
        books: bestsellers.results
      });
    });
  });
  
  /**
   * GET /api/paypal
   * PayPal SDK example.
   */
  
  router.get('/api/paypal', function (req, res, next) {
    paypal.configure(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).paypal);
    var payment_details = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).paypal.returnUrl,
        cancel_url: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).paypal.cancelUrl
      },
      transactions: [{
        description: 'ITEM: Something Awesome!',
        amount: {
          currency: 'USD',
          total: '2.99'
        }
      }]
    };
    paypal.payment.create(payment_details, function (error, payment) {
      if (error) {
        // TODO FIXME
        console.log(error);
      } else {
        req.session.payment_id = payment.id;
        var links = payment.links;
        for (var i = 0; i < links.length; i++) {
          if (links[i].rel === 'approval_url') {
            res.render('api/paypal', {
              url: '/apilocked',
              approval_url: links[i].href
            });
          }
        }
      }
    });
  });
  
  /**
   * GET /api/paypal/success
   * PayPal SDK example.
   */
  
  router.get('/api/paypal/success', function (req, res, next) {
    var payment_id = req.session.payment_id;
    var payment_details = { payer_id: req.query.PayerID };
    paypal.payment.execute(payment_id, payment_details, function (error, payment) {
      if (error) {
        res.render('api/paypal', {
          url: req.url,
          result: true,
          success: false
        });
      } else {
        res.render('api/paypal', {
          url: '/apilocked',
          result: true,
          success: true
        });
      }
    });
  });
  
  /**
   * GET /api/paypal/cancel
   * PayPal SDK example.
   */
  
  router.get('/api/paypal/cancel', function (req, res, next) {
    req.session.payment_id = null;
    res.render('api/paypal', {
      url: '/apilocked',
      result: true,
      canceled: true
    });
  });
  
  /**
   * GET /api/scraping
   * Web scraping example using Cheerio library.
   */
  
  router.get('/api/scraping', function (req, res, next) {
  
    request.get({ url: 'https://news.ycombinator.com/', timeout: 3000 }, function (err, response, body) {
      if (!err && response.statusCode === 200) {
        var $ = cheerio.load(body);
  
        // Get Articles
        var links = [];
        $('.title a[href^="http"], .title a[href^="https"], .title a[href^="item"]').each(function () {
          if ($(this).text() !== 'scribd') {
            if ($(this).text() !== 'Bugs') {
              links.push($(this));
            }
          }
        });
  
        // Get Comments
        var comments = [];
        $('.subtext a[href^="item"]').each(function () {
          comments.push('<a href="https://news.ycombinator.com/' + $(this).attr('href') + '">' + $(this).text() + '</a>');
        });
  
        // Render Page
        res.render('api/scraping', {
          url: '/apiopen',
          links: links,
          comments: comments
        });
      } else {
        req.flash('error', { msg: 'Sorry, something went wrong!  MSG: ' + err.message });
        return res.redirect('back');
      }
    });
  });
  
  /**
   * GET /api/socrata
   * Web scraping example using Cheerio library.
   */
  
  router.get('/api/socrata', function (req, res, next) {
    // Get the socrata open data as JSON
    // http://dev.socrata.com/docs/queries.html
    request.get({ url: 'http://controllerdata.lacity.org/resource/qjfm-3srk.json?$order=q4_earnings DESC&$where=year = 2014&$limit=20', timeout: 5000 }, function (err, response, body) {
      if (!err && response.statusCode === 200) {
        // Parse the data
        var payroll = JSON.parse(body);
        // Render the page
        res.render('api/socrata', {
          url: '/apiopen',
          data: payroll
        });
      } else {
        req.flash('error', { msg: 'Sorry, something went wrong!  MSG: ' + err.message });
        return res.redirect('back');
      }
    });
  });
  
  /**
   * GET /api/twilio
   * Twilio API example.
   */
  
  router.get('/api/twilio', function (req, res, next) {
    res.render('api/twilio', {
      url: '/apiopen'
    });
  });
  
  /**
   * POST /api/twilio
   * Twilio API example.
   * @param telephone
   */
  
  router.post('/api/twilio', function (req, res, next) {
    var message = {
      to: req.body.telephone,
      from: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).twilio.phone,
      body: 'Hello from ' + app.locals.application + '. We are happy you are testing our code!'
    };
    twilio.sendMessage(message, function (err, responseData) {
      if (err) {
        return next(err);
      }
      req.flash('success', { msg: 'Text sent to ' + responseData.to + '.' });
      res.redirect('/api/twilio');
    });
  });
  
  /**
   * GET /api/foursquare
   * Foursquare API example.
   */
  
  router.get('/api/foursquare', _auth.isAuthenticated, _auth.isAuthorized, function (req, res, next) {
    var token = _.find(req.user.tokens, { kind: 'foursquare' });
    async.parallel({
      trendingVenues: function trendingVenues(callback) {
        foursquare.Venues.getTrending('40.7222756', '-74.0022724', { limit: 50 }, token.accessToken, function (err, results) {
          callback(err, results);
        });
      },
      venueDetail: function venueDetail(callback) {
        foursquare.Venues.getVenue('49da74aef964a5208b5e1fe3', token.accessToken, function (err, results) {
          callback(err, results);
        });
      },
      userCheckins: function userCheckins(callback) {
        foursquare.Users.getCheckins('self', null, token.accessToken, function (err, results) {
          callback(err, results);
        });
      }
    }, function (err, results) {
      if (err) {
        return next(err);
      }
      res.render('api/foursquare', {
        url: '/apilocked',
        trendingVenues: results.trendingVenues,
        venueDetail: results.venueDetail,
        userCheckins: results.userCheckins
      });
    });
  });
  
  /**
   * GET /api/tumblr
   * Tumblr API example.
   */
  
  router.get('/api/tumblr', _auth.isAuthenticated, _auth.isAuthorized, function (req, res) {
    var token = _.find(req.user.tokens, { kind: 'tumblr' });
    var client = tumblr.createClient({
      consumer_key: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).tumblr.key,
      consumer_secret: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).tumblr.secret,
      token: token.token,
      token_secret: token.tokenSecret
    });
    client.posts('danielmoyerdesign.tumblr.com', { type: 'photo' }, function (err, data) {
      res.render('api/tumblr', {
        url: '/apilocked',
        blog: data.blog,
        photoset: data.posts[0].photos
      });
    });
  });
  
  /**
   * GET /api/facebook
   * Facebook API example.
   */
  
  router.get('/api/facebook', _auth.isAuthenticated, _auth.isAuthorized, function (req, res, next) {
    var token = _.find(req.user.tokens, { kind: 'facebook' });
    graph.setAccessToken(token.accessToken);
    async.parallel({
      getMe: function getMe(done) {
        graph.get(req.user.facebook, function (err, me) {
          done(err, me);
        });
      },
      getMyFriends: function getMyFriends(done) {
        graph.get(req.user.facebook + '/friends', function (err, friends) {
          debug('Friends: ' + JSON.stringify(friends));
          done(err, friends);
        });
      }
    }, function (err, results) {
      if (err) {
        return next(err);
      }
      res.render('api/facebook', {
        url: '/apilocked',
        me: results.getMe,
        friends: results.getMyFriends
      });
    });
  });
  
  /**
   * GET /api/github
   * GitHub API Example.
   */
  
  router.get('/api/github', _auth.isAuthenticated, _auth.isAuthorized, function (req, res) {
    var token = _.find(req.user.tokens, { kind: 'github' });
    var github = new Github({ token: token.accessToken });
    var repo = github.getRepo('dstroot', 'skeleton');
    repo.show(function (err, repo) {
      res.render('api/github', {
        url: '/apilocked',
        repo: repo
      });
    });
  });
  
  /**
   * GET /api/twitter
   * Twitter API example.
   * https://dev.twitter.com/rest/reference/get/search/tweets
   */
  
  router.get('/api/twitter', _auth.isAuthenticated, _auth.isAuthorized, function (req, res, next) {
    var token = _.find(req.user.tokens, { kind: 'twitter' });
    var params = { q: 'iPhone 6', since_id: 24012619984051000, count: 10, result_type: 'popular' };
    var T = new Twit({
      consumer_key: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).twitter.consumerKey,
      consumer_secret: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).twitter.consumerSecret,
      access_token: token.token,
      access_token_secret: token.tokenSecret
    });
    T.get('search/tweets', params, function (err, data, response) {
      if (err) {
        return next(err);
      }
      res.render('api/twitter', {
        url: '/apilocked',
        tweets: data.statuses
      });
    });
  });
  
  /**
   * POST /api/twitter
   * Post a tweet.
   */
  
  router.post('/api/twitter', _auth.isAuthenticated, _auth.isAuthorized, function (req, res, next) {
    req.assert('tweet', 'Tweet cannot be empty.').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/api/twitter');
    }
    var token = _.find(req.user.tokens, { kind: 'twitter' });
    var T = new Twit({
      consumer_key: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).twitter.consumerKey,
      consumer_secret: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).twitter.consumerSecret,
      access_token: token.token,
      access_token_secret: token.tokenSecret
    });
    T.post('statuses/update', { status: req.body.tweet }, function (err, data, response) {
      if (err) {
        return next(err);
      }
      req.flash('success', { msg: 'Tweet has been posted.' });
      res.redirect('/api/twitter');
    });
  });
  
  exports.default = router;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

  'use strict'
  
  /**
   * Module Dependencies
   */
  
  ;
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _express = __webpack_require__(1);
  
  var _User = __webpack_require__(6);
  
  var _User2 = _interopRequireDefault(_User);
  
  var _lodash = __webpack_require__(3);
  
  var _lodash2 = _interopRequireDefault(_lodash);
  
  var _auth = __webpack_require__(17);
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  
  function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; }
  
  /**
   * Auth Controller
   */
  
  var router = new _express.Router();
  
  /**
   * Google Authentication
   * Utilize 3 different libraries just for OAuth.
   *
   * 1. Using Grant to handle standardizing the initial token rest
   * 2. Using GoogleAuthLibrary to verify the id token (using it because it will cache the cert files)
   * 3. Using Purest to retrieve the profile info on registration
   */
  
  router.get('/auth/google/callback', function (req, res, next) {
  
    var google = new _auth.GoogleProvider(res.locals.config.OAuth.google);
    var oAuthPayload = req.session.grant.response.raw;
  
    google.verifyIdToken(oAuthPayload.id_token).then((function () {
      var _this = this;
  
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(payload) {
        var user, redirectURL, profile;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _User2.default.findOne({ google: payload['sub'] });
  
              case 2:
                user = _context.sent;
  
                if (!user) {
                  _context.next = 20;
                  break;
                }
  
                user.activity.last_logon = Date.now();
                _context.next = 7;
                return user.saveAsync();
  
              case 7:
                _context.next = 9;
                return req.login(user);
  
              case 9:
                if (!req.session.attemptedURL) {
                  _context.next = 16;
                  break;
                }
  
                console.log('Sending user to attemptedURL');
                redirectURL = req.session.attemptedURL;
  
                delete req.session.attemptedURL;
                return _context.abrupt('return', res.redirect(redirectURL));
  
              case 16:
                console.log('User authenticated, going to /api');
                return _context.abrupt('return', res.redirect('/api'));
  
              case 18:
                _context.next = 30;
                break;
  
              case 20:
                console.log('No user found, creating a new user');
                _context.next = 23;
                return google.getCurrentProfile(oAuthPayload.access_token);
  
              case 23:
                profile = _context.sent;
  
                console.log(profile);
                req.session.socialProfile = google.serializeUser(profile);
                req.session.socialProfile['accessToken'] = oAuthPayload.access_token;
                req.session.socialProfile['refreshToken'] = oAuthPayload.refresh_token;
                console.log(req.session.socialProfile);
                return _context.abrupt('return', res.render('account/signupsocial', { email: req.session.socialProfile.email }));
  
              case 30:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));
  
      return function (_x) {
        return ref.apply(this, arguments);
      };
    })()).catch(function (error) {
      console.log(error.stack);
      return next(error);
    });
  });
  
  exports.default = router;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _express = __webpack_require__(1);
  
  function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Home Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                */
  
  var router = new _express.Router();
  
  router.get('/', (function () {
    var _this = this;
  
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(req, res, next) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!req.user) {
                _context.next = 2;
                break;
              }
  
              return _context.abrupt('return', res.redirect('/api'));
  
            case 2:
              res.render('home/home', {
                url: req.url
              });
  
            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));
  
    return function (_x, _x2, _x3) {
      return ref.apply(this, arguments);
    };
  })());
  
  exports.default = router;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

  'use strict'
  
  /**
   * Module Dependencies
   */
  
  ;
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _express = __webpack_require__(1);
  
  var _User = __webpack_require__(6);
  
  var _User2 = _interopRequireDefault(_User);
  
  var _async = __webpack_require__(7);
  
  var _async2 = _interopRequireDefault(_async);
  
  var _crypto = __webpack_require__(8);
  
  var _crypto2 = _interopRequireDefault(_crypto);
  
  var _nodemailer = __webpack_require__(43);
  
  var _nodemailer2 = _interopRequireDefault(_nodemailer);
  
  var _LoginAttempt = __webpack_require__(14);
  
  var _LoginAttempt2 = _interopRequireDefault(_LoginAttempt);
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  
  /**
   * User Controller
   */
  
  var router = new _express.Router();
  
  /**
   * GET /login
   * Render login page
   */
  
  router.get('/login', function (req, res) {
    // Check if user is already logged in
    if (req.user) {
      req.flash('info', { msg: 'You are already logged in!' });
      return res.redirect('/api');
    }
    // Turn off login form if too many attempts
    var tooManyAttempts = req.session.tooManyAttempts || false;
    req.session.tooManyAttempts = null;
    // Render Login form
    res.render('account/login', {
      tooManyAttempts: tooManyAttempts,
      url: req.url
    });
  });
  
  /**
   * POST /login
   * Log the user in
   */
  
  router.post('/login', function (req, res, next) {
  
    // Begin a workflow
    var workflow = new (__webpack_require__(2).EventEmitter)();
  
    /**
     * Step 1: Validate the data
     */
  
    workflow.on('validate', function () {
  
      // Validate the form fields
      req.assert('email', 'Your email cannot be empty.').notEmpty();
      req.assert('email', 'Your email is not valid').isEmail();
      req.assert('password', 'Your password cannot be blank').notEmpty();
      req.assert('password', 'Your password must be at least 4 characters long.').len(4);
  
      var errors = req.validationErrors();
  
      if (errors) {
        req.flash('error', errors);
        return res.redirect('/login');
      }
  
      // next step
      workflow.emit('abuseFilter');
    });
  
    /**
     * Step 2: Prevent brute force login hacking
     */
  
    workflow.on('abuseFilter', function () {
  
      var getIpCount = function getIpCount(done) {
        var conditions = { ip: req.ip };
        _LoginAttempt2.default.count(conditions, function (err, count) {
          if (err) {
            return done(err);
          }
          done(null, count);
        });
      };
  
      var getIpUserCount = function getIpUserCount(done) {
        var conditions = { ip: req.ip, user: req.body.email.toLowerCase() };
        _LoginAttempt2.default.count(conditions, function (err, count) {
          if (err) {
            return done(err);
          }
          done(null, count);
        });
      };
  
      var asyncFinally = function asyncFinally(err, results) {
        if (err) {
          return workflow.emit('exception', err);
        }
  
        if (results.ip >= ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).loginAttempts.forIp || results.ipUser >= ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).loginAttempts.forUser) {
          req.flash('error', { msg: 'You\'ve reached the maximum number of login attempts. Please try again later or reset your password.' });
          req.session.tooManyAttempts = true;
          return res.redirect('/login');
        } else {
          workflow.emit('authenticate');
        }
      };
  
      async.parallel({ ip: getIpCount, ipUser: getIpUserCount }, asyncFinally);
    });
  
    /**
     * Step 3: Authenticate the user
     */
  
    workflow.on('authenticate', function () {
  
      // Authenticate the user
      Passport.authenticate('local', function (err, user, info) {
        if (err) {
          req.flash('error', { msg: err.message });
          return res.redirect('back');
        }
  
        if (!user) {
  
          // Update abuse count
          var fieldsToSet = { ip: req.ip, user: req.body.email };
          _LoginAttempt2.default.create(fieldsToSet, function (err, doc) {
            if (err) {
              req.flash('error', { msg: err.message });
              return res.redirect('back');
            } else {
              // User Not Found (Return)
              req.flash('error', { msg: info.message });
              return res.redirect('/login');
            }
          });
        } else {
  
          // update the user's record with login timestamp
          user.activity.last_logon = Date.now();
          user.save(function (err) {
            if (err) {
              req.flash('error', { msg: err.message });
              return res.redirect('back');
            }
          });
  
          // Log user in
          req.logIn(user, function (err) {
            if (err) {
              req.flash('error', { msg: err.message });
              return res.redirect('back');
            }
  
            // Send user on their merry way
            if (req.session.attemptedURL) {
              var redirectURL = req.session.attemptedURL;
              delete req.session.attemptedURL;
              res.redirect(redirectURL);
            } else {
              res.redirect('/api');
            }
          });
        }
      })(req, res, next);
    });
  
    /**
     * Initiate the workflow
     */
  
    workflow.emit('validate');
  });
  
  /**
   * GET /logout
   * Log the user out
   */
  
  router.get('/logout', function (req, res) {
    // Augment Logout to handle enhanced security
    delete req.session.passport.secondFactor;
    req.logout();
    res.redirect('/');
  });
  
  /**
   * GET /verify/:id/:token
   * Verify the user after signup
   */
  
  router.get('/verify/:id/:token', function (req, res) {
  
    // Create a workflow
    var workflow = new (__webpack_require__(2).EventEmitter)();
  
    /**
     * Step 1: Validate the user and token
     */
  
    workflow.on('validate', function () {
  
      // Get the user using their ID and token
      _User2.default.findOne({ _id: req.params.id, verifyToken: req.params.token }, function (err, user) {
        if (err) {
          req.flash('error', { msg: err.message });
          req.flash('warning', { msg: 'Your account verification is invalid or has expired.' });
          return res.redirect('/');
        }
  
        if (!user) {
          req.flash('warning', { msg: 'Your password reset request is invalid or has expired.' });
          return res.redirect('/');
        } else {
  
          // Let's verify the user!
          user.verified = true;
          user.verifyToken = undefined;
          user.activity.last_logon = Date.now();
  
          // update the user record
          user.save(function (err) {
            if (err) {
              req.flash('error', { msg: err.message });
              return res.redirect('back');
            }
  
            // next step
            workflow.emit('sendWelcomeEmail', user);
          });
        }
      });
    });
  
    /**
     * Step 2: Send them a welcome email
     */
  
    workflow.on('sendWelcomeEmail', function (user) {
  
      // Create reusable transporter object using SMTP transport
      var transporter = _nodemailer2.default.createTransport({
        service: 'Gmail',
        auth: {
          user: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.user,
          pass: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.password
        }
      });
  
      // Render HTML to send using .jade mail template (just like rendering a page)
      res.render('mail/welcome', {
        name: user.profile.name,
        mailtoName: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name,
        mailtoAddress: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address,
        blogLink: req.protocol + '://' + req.headers.host, // + '/blog',
        forumLink: req.protocol + '://' + req.headers.host // + '/forum'
      }, function (err, html) {
        if (err) {
          return err, null;
        } else {
  
          // Now create email text (multiline string as array FTW)
          var text = ['Hello ' + user.profile.name + '!', 'We would like to welcome you as our newest member!', 'Thanks so much for using our services! If you have any questions, or suggestions, feel free to email us here at ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '.', 'If you want to get the latest scoop check out our <a href="' + req.protocol + '://' + req.headers.host + '/blog' + '">blog</a> and our <a href="' + req.protocol + '://' + req.headers.host + '/forums">forums</a>.', '  - The ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' team'].join('\n\n');
  
          // Create email
          var mailOptions = {
            to: user.profile.name + ' <' + user.email + '>',
            from: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' <' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '>',
            subject: 'Welcome to ' + req.app.locals.application + '!',
            text: text,
            html: html
          };
  
          // Send email
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              req.flash('error', { msg: JSON.stringify(err) });
              debug(JSON.stringify(err));
            } else {
              debug('Message response: ' + info.response);
            }
          });
        }
      });
  
      // next step
      workflow.emit('logUserIn', user);
    });
  
    /**
     * Step 3: Log them in
     */
  
    workflow.on('logUserIn', function (user) {
  
      // log the user in
      req.logIn(user, function (err) {
        if (err) {
          req.flash('error', { msg: err.message });
          return res.redirect('back');
        }
        req.flash('info', { msg: 'Your account verification is completed!' });
        res.redirect('/api');
      });
  
      // WORKFLOW COMPLETED
    });
  
    /**
     * Initiate the workflow
     */
  
    workflow.emit('validate');
  });
  
  /**
   * GET /signup
   * Render signup page
   */
  
  router.get('/signup', function (req, res) {
    if (req.user) {
      return res.redirect('/');
    }
    res.render('account/signup', {
      url: req.url
    });
  });
  
  /**
   * POST /signup
   * Process a *regular* signup
   */
  
  router.post('/signup', function (req, res, next) {
  
    // Begin a workflow
    var workflow = new (__webpack_require__(2).EventEmitter)();
  
    /**
     * Step 1: Validate the form fields
     */
  
    workflow.on('validate', function () {
  
      // Check for form errors
      req.assert('name', 'Your name cannot be empty.').notEmpty();
      req.assert('email', 'Your email cannot be empty.').notEmpty();
      req.assert('email', 'Your email is not valid.').isEmail();
      req.assert('password', 'Your password cannot be empty.').notEmpty();
      req.assert('confirmPassword', 'Your password confirmation cannot be empty.').notEmpty();
      req.assert('password', 'Your password must be at least 4 characters long.').len(4);
      req.assert('confirmPassword', 'Your passwords do not match.').equals(req.body.password);
  
      var errors = req.validationErrors();
  
      if (errors) {
        req.flash('error', errors);
        return res.redirect('back');
      }
  
      // next step
      workflow.emit('verification');
    });
  
    /**
     * Step 2: Account verification step
     */
  
    workflow.on('verification', function () {
  
      var verified;
      var verifyToken;
  
      if (({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).verificationRequired) {
        verified = false;
        // generate verification token
        crypto.randomBytes(25, function (err, buf) {
          verifyToken = buf.toString('hex');
          // next step
          workflow.emit('createUser', verified, verifyToken);
        });
      } else {
        verified = true;
        verifyToken = null;
        // next step
        workflow.emit('createUser', verified, verifyToken);
      }
    });
  
    /**
     * Step 3: Create a new account
     */
  
    workflow.on('createUser', function (verified, verifyToken) {
  
      // create user
      var user = new _User2.default({
        'profile.name': req.body.name.trim(),
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        verifyToken: verifyToken,
        verified: verified
      });
  
      // save user
      user.save(function (err) {
        if (err) {
          if (err.code === 11000) {
            req.flash('error', { msg: 'An account with that email address already exists!' });
            req.flash('info', { msg: 'You should sign in with that account.' });
          }
          return res.redirect('back');
        } else {
          if (({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).verificationRequired) {
            // next step (4a)
            workflow.emit('sendValidateEmail', user, verifyToken);
          } else {
            // next step (4b)
            workflow.emit('sendWelcomeEmail', user);
          }
        }
      });
    });
  
    /**
     * Step 4a: Send them a validate email
     */
  
    workflow.on('sendValidateEmail', function (user, verifyToken) {
  
      // Create reusable transporter object using SMTP transport
      var transporter = _nodemailer2.default.createTransport({
        service: 'Gmail',
        auth: {
          user: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.user,
          pass: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.password
        }
      });
  
      // Render HTML to send using .jade mail template (just like rendering a page)
      res.render('mail/accountVerification', {
        name: user.profile.name,
        mailtoName: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name,
        validateLink: req.protocol + '://' + req.headers.host + '/verify/' + user.id + '/' + verifyToken
      }, function (err, html) {
        if (err) {
          return err, null;
        } else {
  
          // Now create email text (multiline string as array FTW)
          var text = ['Hello ' + user.profile.name + '!', 'Welcome to ' + req.app.locals.application + '!  Here is a special link to activate your new account:', req.protocol + '://' + req.headers.host + '/verify/' + user.id + '/' + user.verifyToken, '  - The ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' team'].join('\n\n');
  
          // Create email
          var mailOptions = {
            to: user.profile.name + ' <' + user.email + '>',
            from: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' <' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '>',
            subject: 'Activate your new ' + req.app.locals.application + ' account',
            text: text,
            html: html
          };
  
          // Send email
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              req.flash('error', { msg: JSON.stringify(err) });
              debug(JSON.stringify(err));
              res.redirect('back');
            } else {
              debug('Message response: ' + info.response);
              req.flash('info', { msg: 'Please check your email to verify your account. Thanks for signing up!' });
              res.redirect('/signup');
            }
          });
        }
      });
  
      // WORKFLOW COMPLETED
    });
  
    /**
     * Step 4b: Send them a welcome email
     */
  
    workflow.on('sendWelcomeEmail', function (user) {
  
      // Create reusable transporter object using SMTP transport
      var transporter = _nodemailer2.default.createTransport({
        service: 'Gmail',
        auth: {
          user: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.user,
          pass: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.password
        }
      });
  
      // Render HTML to send using .jade mail template (just like rendering a page)
      res.render('mail/welcome', {
        name: user.profile.name,
        mailtoName: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name,
        mailtoAddress: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address,
        blogLink: req.protocol + '://' + req.headers.host, // + '/blog',
        forumLink: req.protocol + '://' + req.headers.host // + '/forum'
      }, function (err, html) {
        if (err) {
          return err, null;
        } else {
  
          // Now create email text (multiline string as array FTW)
          var text = ['Hello ' + user.profile.name + '!', 'We would like to welcome you as our newest member!', 'Thanks so much for using our services! If you have any questions, or suggestions, feel free to email us here at ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '.', 'If you want to get the latest scoop check out our <a href="' + req.protocol + '://' + req.headers.host + '/blog' + '">blog</a> and our <a href="' + req.protocol + '://' + req.headers.host + '/forums">forums</a>.', '  - The ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' team'].join('\n\n');
  
          // Create email
          var mailOptions = {
            to: user.profile.name + ' <' + user.email + '>',
            from: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' <' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '>',
            subject: 'Welcome to ' + req.app.locals.application + '!',
            text: text,
            html: html
          };
  
          // Send email
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              req.flash('error', { msg: JSON.stringify(err) });
              debug(JSON.stringify(err));
            } else {
              debug('Message response: ' + info.response);
            }
          });
        }
      });
  
      // next step
      workflow.emit('logUserIn', user);
    });
  
    /**
     * Step 5: Log them in
     */
  
    workflow.on('logUserIn', function (user) {
  
      // log the user in
      req.logIn(user, function (err) {
        if (err) {
          req.flash('error', { msg: err.message });
          return res.redirect('back');
        }
        // send the right welcome message
        if (({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).twoFactor) {
          req.flash('warning', { msg: 'Welcome! We recommend turning on enhanced security in account settings.' });
          res.redirect('/api');
        } else {
          req.flash('info', { msg: 'Thanks for signing up! You rock!' });
          res.redirect('/api');
        }
      });
  
      // WORKFLOW COMPLETED
    });
  
    /**
     * Initiate the workflow
     */
  
    workflow.emit('validate');
  });
  
  /**
   * GET /signupsocial
   * Confirm social email address
   */
  
  router.get('/signupsocial', function (req, res) {
    res.render('account/signupsocial', {
      url: req.url,
      email: ''
    });
  });
  
  /**
   * POST /signupsocial
   * Process a *Social* signup & confirm email address
   */
  
  router.post('/signupsocial', function (req, res, next) {
  
    // Begin a workflow
    var workflow = new (__webpack_require__(2).EventEmitter)();
  
    /**
     * Step 1: Validate the form fields
     */
  
    workflow.on('validate', function () {
  
      // Check for form errors
      req.assert('email', 'Your email cannot be empty.').notEmpty();
      req.assert('email', 'Your email is not valid.').isEmail();
  
      var errors = req.validationErrors();
  
      if (errors) {
        req.flash('error', errors);
        return res.redirect('/signupsocial');
      }
  
      // next step
      workflow.emit('duplicateEmailCheck');
    });
  
    /**
     * Step 2: Make sure the email address is unique
     */
  
    workflow.on('duplicateEmailCheck', function () {
  
      // Make sure we have a unique email address!
      _User2.default.findOne({ email: req.body.email.toLowerCase() }, function (err, user) {
        if (err) {
          req.flash('error', { msg: err.msg });
          return res.redirect('/signupsocial');
        }
        if (user) {
          req.flash('error', { msg: 'Sorry that email address has already been used!' });
          req.flash('info', { msg: 'You can sign in with that account and link this provider, or you can create a new account by entering a different email address.' });
          return res.redirect('/signupsocial');
        } else {
          // next step
          workflow.emit('createUser');
        }
      });
    });
  
    /**
     * Step 4: Create a new account
     */
  
    workflow.on('createUser', function () {
  
      var newUser = req.session.socialProfile;
      var user = new _User2.default();
  
      user.verified = true; // social users don't require verification
      user.email = req.body.email.toLowerCase();
      user.profile.name = newUser.profile.name;
      user.profile.gender = newUser.profile.gender;
      user.profile.location = newUser.profile.location;
      user.profile.website = newUser.profile.website;
      user.profile.picture = newUser.profile.picture;
  
      if (newUser.source === 'twitter') {
        user.twitter = newUser.id;
        user.tokens.push({ kind: 'twitter', token: newUser.token, tokenSecret: newUser.tokenSecret });
      } else if (newUser.source === 'facebook') {
        user.facebook = newUser.id;
        user.tokens.push({ kind: 'facebook', accessToken: newUser.accessToken, refreshToken: newUser.refreshToken });
      } else if (newUser.source === 'github') {
        user.github = newUser.id;
        user.tokens.push({ kind: 'github', accessToken: newUser.accessToken, refreshToken: newUser.refreshToken });
      } else if (newUser.source === 'google') {
        user.google = newUser.id;
        user.tokens.push({ kind: 'google', accessToken: newUser.accessToken, refreshToken: newUser.refreshToken });
      }
  
      // save user
      user.save(function (err) {
        if (err) {
          if (err.code === 11000) {
            req.flash('error', { msg: 'An account with that email already exists!' });
          }
          return res.redirect('/signupsocial');
        } else {
          // next step
          workflow.emit('sendWelcomeEmail', user);
        }
      });
    });
  
    /**
     * Step 5: Send them a welcome email
     */
  
    workflow.on('sendWelcomeEmail', function (user) {
  
      // Create reusable transporter object using SMTP transport
      var transporter = _nodemailer2.default.createTransport({
        service: 'Gmail',
        auth: {
          user: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.user,
          pass: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).gmail.password
        }
      });
  
      // Render HTML to send using .jade mail template (just like rendering a page)
      res.render('mail/welcome', {
        name: user.profile.name,
        mailtoName: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name,
        mailtoAddress: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address,
        blogLink: req.protocol + '://' + req.headers.host, // + '/blog',
        forumLink: req.protocol + '://' + req.headers.host // + '/forum'
      }, function (err, html) {
        if (err) {
          return err, null;
        } else {
  
          // Now create email text (multiline string as array FTW)
          var text = ['Hello ' + user.profile.name + '!', 'We would like to welcome you as our newest member!', 'Thanks so much for using our services! If you have any questions, or suggestions, feel free to email us here at ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '.', 'If you want to get the latest scoop check out our <a href="' + req.protocol + '://' + req.headers.host + '/blog' + '">blog</a> and our <a href="' + req.protocol + '://' + req.headers.host + '/forums">forums</a>.', '  - The ' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' team'].join('\n\n');
  
          // Create email
          var mailOptions = {
            to: user.profile.name + ' <' + user.email + '>',
            from: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.name + ' <' + ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).smtp.address + '>',
            subject: 'Welcome to ' + req.app.locals.application + '!',
            text: text,
            html: html
          };
  
          // Send email
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              req.flash('error', { msg: JSON.stringify(err) });
              debug(JSON.stringify(err));
            } else {
              debug('Message response: ' + info.response);
            }
          });
        }
      });
  
      // next step
      workflow.emit('logUserIn', user);
    });
  
    /**
     * Step 6: Log them in
     */
  
    workflow.on('logUserIn', function (user) {
  
      // log the user in
      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        req.flash('info', { msg: 'Thanks for signing up! You rock!' });
        res.redirect('/api');
      });
    });
  
    /**
     * Initiate the workflow
     */
  
    workflow.emit('validate');
  });
  
  exports.default = router;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

  'use strict'
  
  /**
   * Module Dependencies
   */
  
  ;
  var mongoose = __webpack_require__(4);
  
  /**
   * Define Login Attempts Schema
   */
  
  var attemptSchema = new mongoose.Schema({
    ip: { type: String, default: '' },
    user: { type: String, default: '' },
    time: { type: Date, default: Date.now, expires: ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).loginAttempts.expires }
  });
  
  /**
   * Define Indices
   */
  
  attemptSchema.index({ ip: 1 });
  attemptSchema.index({ user: 1 });
  attemptSchema.set('autoIndex');
  
  /**
   * Export Model
   */
  
  module.exports = mongoose.model('LoginAttempt', attemptSchema);

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _express = __webpack_require__(1);
  
  var rootRouter = new _express.Router();
  
  rootRouter.use('/', __webpack_require__(13).default);
  rootRouter.use('/', __webpack_require__(12).default);
  rootRouter.use('/', __webpack_require__(11).default);
  rootRouter.use('/', __webpack_require__(10).default);
  
  exports.default = rootRouter;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

  'use strict'
  
  /**
   * Module Dependencies
   */
  
  // Express 4.x Modules
  ;
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _http = __webpack_require__(38);
  
  var _http2 = _interopRequireDefault(_http);
  
  var _csurf = __webpack_require__(26);
  
  var _csurf2 = _interopRequireDefault(_csurf);
  
  var _morgan = __webpack_require__(42);
  
  var _morgan2 = _interopRequireDefault(_morgan);
  
  var _express = __webpack_require__(1);
  
  var _express2 = _interopRequireDefault(_express);
  
  var _serveFavicon = __webpack_require__(51);
  
  var _serveFavicon2 = _interopRequireDefault(_serveFavicon);
  
  var _expressSession = __webpack_require__(29);
  
  var _expressSession2 = _interopRequireDefault(_expressSession);
  
  var _compression = __webpack_require__(24);
  
  var _compression2 = _interopRequireDefault(_compression);
  
  var _bodyParser = __webpack_require__(22);
  
  var _bodyParser2 = _interopRequireDefault(_bodyParser);
  
  var _errorhandler = __webpack_require__(27);
  
  var _errorhandler2 = _interopRequireDefault(_errorhandler);
  
  var _methodOverride = __webpack_require__(40);
  
  var _methodOverride2 = _interopRequireDefault(_methodOverride);
  
  var _fs = __webpack_require__(33);
  
  var _fs2 = _interopRequireDefault(_fs);
  
  var _path = __webpack_require__(45);
  
  var _path2 = _interopRequireDefault(_path);
  
  var _debug = __webpack_require__(9);
  
  var _debug2 = _interopRequireDefault(_debug);
  
  var _expressFlash = __webpack_require__(28);
  
  var _expressFlash2 = _interopRequireDefault(_expressFlash);
  
  var _helmet = __webpack_require__(37);
  
  var _helmet2 = _interopRequireDefault(_helmet);
  
  var _semver = __webpack_require__(50);
  
  var _semver2 = _interopRequireDefault(_semver);
  
  var _expressSslify = __webpack_require__(30);
  
  var _expressSslify2 = _interopRequireDefault(_expressSslify);
  
  var _mongoose = __webpack_require__(4);
  
  var _mongoose2 = _interopRequireDefault(_mongoose);
  
  var _connectMongo = __webpack_require__(25);
  
  var _connectMongo2 = _interopRequireDefault(_connectMongo);
  
  var _expressValidator = __webpack_require__(31);
  
  var _expressValidator2 = _interopRequireDefault(_expressValidator);
  
  var _socket = __webpack_require__(52);
  
  var _socket2 = _interopRequireDefault(_socket);
  
  var _grantExpress = __webpack_require__(36);
  
  var _grantExpress2 = _interopRequireDefault(_grantExpress);
  
  var _auth = __webpack_require__(5);
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  
  /**
   * Initialize variables
   */
  // https://npmjs.org/package/connect-mongo
  // https://github.com/florianheinemann/express-sslify
  // https://github.com/evilpacket/helmet
  // https://github.com/visionmedia/debug
  // http://nodejs.org/docs/v0.10.25/api/fs.html
  // https://github.com/expressjs/errorhandler
  // https://github.com/expressjs/compression
  // https://github.com/expressjs/favicon
  // https://github.com/expressjs/morgan
  var app = (0, _express2.default)(); // https://npmjs.org/package/express-validator
  // https://npmjs.org/package/mongoose
  // https://npmjs.org/package/semver
  // https://npmjs.org/package/express-flash
  // http://nodejs.org/docs/v0.10.25/api/path.html
  // https://github.com/expressjs/method-override
  
  // Additional Modules
  // https://github.com/expressjs/body-parser
  // https://github.com/expressjs/session
  // https://npmjs.org/package/express
  // https://github.com/expressjs/csurf
  
  var server = undefined;
  var io = undefined;
  var httpEnabled = ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).http && ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).http.enable;
  var httpsEnabled = ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).https && ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).https.enable;
  var debug = (0, _debug2.default)(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).name);
  var mongoStore = (0, _connectMongo2.default)(_expressSession2.default);
  var db = connectMongoDB();
  var grant = (0, _grantExpress2.default)(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).OAuth);
  
  // Use Mongo for session store
  ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).session.store = new mongoStore({
    mongooseConnection: db,
    autoReconnect: true
  });
  
  /**
   * Configure application settings
   */
  
  // Jade View setup
  app.set('views', _path2.default.join(__dirname, 'views'));
  app.set('view engine', 'jade');
  
  // Format dates/times in jade templates
  app.locals.moment = __webpack_require__(41);
  
  // Format numbers in jade templates
  app.locals.numeral = __webpack_require__(44);
  
  if (app.get('env') === 'development') {
    // Jade options: Don't minify html, debug intrumentation
    app.locals.pretty = true;
    app.locals.compileDebug = true;
    // Turn on console logging in development
    app.use((0, _morgan2.default)('dev'));
    // Turn off caching in development
    // This sets the Cache-Control HTTP header to no-store, no-cache,
    // which tells browsers not to cache anything.
    app.use(_helmet2.default.nocache());
  }
  
  if (app.get('env') === 'production') {
    // Jade options: minify html, no debug intrumentation
    app.locals.pretty = false;
    app.locals.compileDebug = false;
    // Enable If behind nginx, proxy, or a load balancer (e.g. Heroku, Nodejitsu)
    app.enable('trust proxy', 1); // trust first proxy
    // In case of a non-encrypted HTTP request, enforce.HTTPS() automatically
    // redirects to an HTTPS address using a 301 permanent redirect. BE VERY
    // CAREFUL with this! 301 redirects are cached by browsers and should be
    // considered permanent.
    //
    // NOTE: Use `enforce.HTTPS(true)` if you are behind a proxy or load
    // balancer that terminates SSL for you (e.g. Heroku, Nodejitsu).
    app.use(_expressSslify2.default.HTTPS(true));
  
    // Turn on HTTPS/SSL cookies
    ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).session.proxy = true;
    ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).session.cookie.secure = true;
  
    app.use(_helmet2.default.contentSecurityPolicy({
      defaultSrc: ['\'none\''],
      connectSrc: ['*'],
      scriptSrc: ['\'self\'', '\'unsafe-eval\''],
      styleSrc: ['\'self\'', 'fonts.googleapis.com', '\'unsafe-inline\''],
      fontSrc: ['\'self\'', 'fonts.gstatic.com'],
      mediaSrc: ['\'self\''],
      objectSrc: ['\'self\''],
      imgSrc: ['*']
    }));
  }
  
  // Favicon - This middleware will come very early in your stack
  // (maybe even first) to avoid processing any other middleware
  // if we already know the request is for favicon.ico
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  
  // Report CSP violations (*ABOVE* CSURF in the middleware stack)
  // Browsers will post violations to this route
  // https://mathiasbynens.be/notes/csp-reports
  app.post('/csp', _bodyParser2.default.json(), function (req, res) {
    // TODO - requires production level logging
    if (req.body) {
      // Just send to debug to see if this is working
      debug('CSP Violation: ' + JSON.stringify(req.body));
    } else {
      debug('CSP Violation: No data received!');
    }
    res.status(204).end();
  });
  
  // Compress response data with gzip / deflate.
  // This middleware should be placed "high" within
  // the stack to ensure all responses are compressed.
  app.use((0, _compression2.default)());
  
  // http://en.wikipedia.org/wiki/HTTP_ETag
  // Google has a nice article about "strong" and "weak" caching.
  // It's worth a quick read if you don't know what that means.
  // https://developers.google.com/speed/docs/best-practices/caching
  app.set('etag', true); // other values 'weak', 'strong'
  
  // Now setup serving static assets from /public
  
  // time in milliseconds...
  var minute = 1000 * 60; //     60000
  var hour = minute * 60; //   3600000
  var day = hour * 24; //  86400000
  var week = day * 7; // 604800000
  
  app.use(_express2.default.static(__dirname + '/public', { maxAge: week }));
  
  // Body parsing middleware supporting
  // JSON, urlencoded, and multipart requests.
  // parse application/x-www-form-urlencoded
  app.use(_bodyParser2.default.urlencoded({ extended: true }));
  
  // Easy form validation!
  // This line must be immediately after bodyParser!
  app.use((0, _expressValidator2.default)());
  
  // If you want to simulate DELETE and PUT
  // in your app you need methodOverride.
  app.use((0, _methodOverride2.default)());
  
  // Use sessions
  // NOTE: cookie-parser not needed with express-session > v1.5
  app.use((0, _expressSession2.default)(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).session));
  
  // Security Settings
  app.disable('x-powered-by'); // Don't advertise our server type
  app.use((0, _csurf2.default)()); // Prevent Cross-Site Request Forgery
  app.use(_helmet2.default.ienoopen()); // X-Download-Options for IE8+
  app.use(_helmet2.default.nosniff()); // Sets X-Content-Type-Options to nosniff
  app.use(_helmet2.default.xssFilter()); // sets the X-XSS-Protection header
  app.use(_helmet2.default.frameguard('deny')); // Prevent iframe clickjacking
  app.use(_helmet2.default.hsts({
    maxAge: 31536000,
    includeSubdomains: true,
    force: httpsEnabled,
    preload: true
  }));
  
  // Grant OAUTH Middleware
  app.use(grant);
  
  // Keep user, csrf token and config available
  app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    res.locals.config = ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}});
    res.locals._csrf = req.csrfToken();
    next();
  });
  
  /** Our middlewares */
  app.use(_auth.requestExtensions);
  
  // Flash messages
  app.use((0, _expressFlash2.default)());
  
  // IE header
  app.use(function (req, res, next) {
    res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    next();
  });
  
  /**
   * Route Controllers
   */
  app.use(__webpack_require__(15).default);
  
  /**
   * Error Handling
   */
  
  // If nothing responded above we will assume a 404
  // (since no routes responded or static assets found)
  //
  // Handle 404 Errors
  app.use(function (req, res, next) {
    res.status(404);
    debug('404 Warning. URL: ' + req.url);
  
    // Respond with html page
    if (req.accepts('html')) {
      res.render('error/404', { url: req.url });
      return;
    }
  
    // Respond with json
    if (req.accepts('json')) {
      res.send({ error: 'Not found!' });
      return;
    }
  
    // Default to plain-text. send()
    res.type('txt').send('Error: Not found!');
  });
  
  // True error-handling middleware requires an arity of 4,
  // aka the signature (err, req, res, next).
  
  // Handle 403 Errors
  app.use(function (err, req, res, next) {
    if (err.status === 403) {
      res.status(err.status);
      debug('403 Not Allowed. URL: ' + req.url + ' Err: ' + err);
  
      // Respond with HTML
      if (req.accepts('html')) {
        res.render('error/403', {
          error: err,
          url: req.url
        });
        return;
      }
  
      // Respond with json
      if (req.accepts('json')) {
        res.send({ error: 'Not Allowed!' });
        return;
      }
  
      // Default to plain-text. send()
      res.type('txt').send('Error: Not Allowed!');
    } else {
      // Since the error is not a 403 pass it along
      return next(err);
    }
  });
  
  // Production 500 error handler (no stacktraces leaked to public!)
  if (app.get('env') === 'production') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      debug('Error: ' + (err.status || 500).toString() + ' ' + err);
      res.render('error/500', {
        error: {} // don't leak information
      });
    });
  }
  
  // Development 500 error handler
  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      debug('Error: ' + (err.status || 500).toString() + ' ' + err);
      res.render('error/500', {
        error: err
      });
    });
  
    // Final error catch-all just in case...
    app.use((0, _errorhandler2.default)());
  }
  
  /*
   * Start Express server.
   *
   *   NOTE: To alter the environment we can set the
   *   NODE_ENV environment variable, for example:
   *
   *     $ NODE_ENV=production node app.js
   *
   *   This is important - many caching mechanisms
   *   are *only* enabled when in production!
   */
  
  /**
   * Configure Mongo Database
   */
  
  db.on('error', function () {
    debug('MongoDB Connection Error. Please make sure MongoDB is running.');
    process.exit(0);
  });
  
  db.on('open', function () {
    debug('Mongodb ' + 'connected!');
    startApp();
  });
  
  // Reconnect on disconnect
  db.on('disconnected', connectMongoDB);
  
  function connectMongoDB() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    return _mongoose2.default.connect(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).mongodb.url).connection;
  }
  
  function startApp() {
    var port = httpsEnabled && ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).https.port || httpEnabled && ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).http.port;
  
    var host = httpsEnabled && ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).https.host || httpEnabled && ({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).http.host || '0.0.0.0';
  
    app.set('host', host);
    app.set('port', port);
  
    // Create the server
    if (httpsEnabled) {
      server = https.createServer({
        key: _fs2.default.readFileSync(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).https.key),
        cert: _fs2.default.readFileSync(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).https.cert)
      }, app);
      io = (0, _socket2.default)(server);
    } else {
      server = _http2.default.createServer(app);
      io = (0, _socket2.default)(server);
    }
  
    // Provide access to the socket server in your controllers
    app.set('io', io);
  
    if (httpsEnabled && httpEnabled) {
      // Create an HTTP -> HTTPS redirect server
      var redirectServer = (0, _express2.default)();
      redirectServer.get('*', function (req, res) {
        var urlPort = port === 80 ? '' : ':' + port;
        res.redirect('https://' + req.hostname + urlPort + req.path);
      });
      _http2.default.createServer(redirectServer).listen(({"name":"Express-Mongoose-and-Socket.io-Skeleton","version":"0.0.1","engine":"4.x.x","http":{"enable":true,"host":"localhost","port":"3000"},"https":{"enable":false,"host":"localhost","port":"3000","key":"../config/ssl/server.key","cert":"../config/ssl/server.crt"},"ga":"google analytics key","logging":false,"mongodb":{"user":"admin","password":"android91","host":"ds027335.mongolab.com","port":"27335","name":"csgo-sampleconsole","url":"mongodb://admin:android91@ds027335.mongolab.com:27335/csgo-sampleconsole"},"session":{"secret":"my big secret","name":"sid","proxy":false,"resave":false,"saveUninitialized":false,"cookie":{"httpOnly":true,"secure":false,"maxAge":604800000}},"loginAttempts":{"forIp":50,"forUser":5,"expires":"20m"},"smtp":{"name":"support","address":"support@skeleton.com"},"gmail":{"user":"alex@eastside.io","password":"android91"},"localAuth":true,"verificationRequired":false,"enhancedSecurity":true,"OAuth":{"server":{"protocol":"http","host":"localhost:3000"},"facebook":{"key":"1429144210482895","secret":"1319c56c9c8dace75143accb8aa03658","response_uri":"/connect/facebook/callback","callback":"/auth/facebook/callback","transport":"session","scope":["email"]},"google":{"key":"509245762210-d3coeoiiki3emo6m7ro1bdi26sse48gm.apps.googleusercontent.com","secret":"cFPJ5EqtOWaPubsRiaAcrE2R","response_uri":"/connect/google/callback","callback":"/auth/google/callback","transport":"session","scope":["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/userinfo.email"]}}}).http.port || 5000, host, listen);
    }
  
    server.listen(port, host, listen);
  }
  
  function listen() {
    // Log how we are running
    console.log('The server is running at http://' + app.get('host') + ':' + app.get('port') + '/');
    console.log('Ctrl+C' + ' to shut down. ;)\n');
  
    // Exit cleanly on Ctrl+C
    process.on('SIGINT', function () {
      io.close(); // close socket.io
      console.log('\n');
      console.log('has ' + 'shutdown');
      console.log('was running for ' + Math.round(process.uptime()).toString() + ' seconds.');
      process.exit(0);
    });
  }
  
  exports.default = server;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.GoogleProvider = undefined;
  
  var _google = __webpack_require__(18);
  
  var _google2 = _interopRequireDefault(_google);
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  
  exports.GoogleProvider = _google2.default;
  exports.default = {
    GoogleProvider: _google2.default
  };

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
  
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _googleAuthLibrary = __webpack_require__(35);
  
  var _googleAuthLibrary2 = _interopRequireDefault(_googleAuthLibrary);
  
  var _purest = __webpack_require__(47);
  
  var _purest2 = _interopRequireDefault(_purest);
  
  var _lodash = __webpack_require__(3);
  
  var _lodash2 = _interopRequireDefault(_lodash);
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  
  function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; }
  
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
  
  var GoogleProvider = (function () {
    function GoogleProvider(config) {
      _classCallCheck(this, GoogleProvider);
  
      this._config = {};
      this._apis = new _purest2.default({ provider: 'google' });
  
      this._config = config;
      this._oAuth2Client = new new _googleAuthLibrary2.default().OAuth2(this._config.key, this._config.secret, this._config.callback);
    }
  
    _createClass(GoogleProvider, [{
      key: 'getCurrentProfile',
      value: (function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(accessToken) {
          var _this = this;
  
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (accessToken) {
                    _context.next = 2;
                    break;
                  }
  
                  return _context.abrupt('return', new Error('No access token provided!'));
  
                case 2:
                  return _context.abrupt('return', new Promise(function (resolve, reject) {
                    _this._apis.query('plus').get('people/me').auth(accessToken).request(function (err, res, body) {
                      if (err) reject(err);else resolve(res.body);
                    });
                  }));
  
                case 3:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
  
        return function getCurrentProfile(_x) {
          return ref.apply(this, arguments);
        };
      })()
    }, {
      key: 'verifyIdToken',
      value: function verifyIdToken(idToken) {
        var _this2 = this;
  
        console.log('verifyIdToken');
        // Call Google's oAuth2Client
        return new Promise(function (resolve, reject) {
          _this2._oAuth2Client.verifyIdToken(idToken, _this2._config.key, function (err, data) {
            if (err) reject(err);else resolve(data.getPayload());
          });
        });
      }
    }, {
      key: 'serializeUser',
      value: function serializeUser(profile) {
        console.log('serializeUser');
        return {
          source: 'google',
          id: profile['id'],
          email: profile['emails'][0]['value'],
          profile: {
            displayName: profile['displayName'],
            name: profile['name'] || { familyName: '', givenName: '' },
            emails: profile['emails'] || [],
            image: profile['image'] || {},
            gender: profile['gender'] || '',
            website: profile['website'] || '',
            location: profile['location'] || '',
            picture: profile['picture'] || '',
            language: profile['language'] || '',
            verified: profile['verified'] || ''
          }
        };
      }
    }]);
  
    return GoogleProvider;
  })();
  
  exports.default = GoogleProvider;

/***/ },
/* 19 */
/***/ function(module, exports) {

  module.exports = require("babel-polyfill");

/***/ },
/* 20 */
/***/ function(module, exports) {

  module.exports = require("bcrypt-nodejs");

/***/ },
/* 21 */
/***/ function(module, exports) {

  module.exports = require("bluebird");

/***/ },
/* 22 */
/***/ function(module, exports) {

  module.exports = require("body-parser");

/***/ },
/* 23 */
/***/ function(module, exports) {

  module.exports = require("cheerio");

/***/ },
/* 24 */
/***/ function(module, exports) {

  module.exports = require("compression");

/***/ },
/* 25 */
/***/ function(module, exports) {

  module.exports = require("connect-mongo");

/***/ },
/* 26 */
/***/ function(module, exports) {

  module.exports = require("csurf");

/***/ },
/* 27 */
/***/ function(module, exports) {

  module.exports = require("errorhandler");

/***/ },
/* 28 */
/***/ function(module, exports) {

  module.exports = require("express-flash");

/***/ },
/* 29 */
/***/ function(module, exports) {

  module.exports = require("express-session");

/***/ },
/* 30 */
/***/ function(module, exports) {

  module.exports = require("express-sslify");

/***/ },
/* 31 */
/***/ function(module, exports) {

  module.exports = require("express-validator");

/***/ },
/* 32 */
/***/ function(module, exports) {

  module.exports = require("fbgraph");

/***/ },
/* 33 */
/***/ function(module, exports) {

  module.exports = require("fs");

/***/ },
/* 34 */
/***/ function(module, exports) {

  module.exports = require("github-api");

/***/ },
/* 35 */
/***/ function(module, exports) {

  module.exports = require("google-auth-library");

/***/ },
/* 36 */
/***/ function(module, exports) {

  module.exports = require("grant-express");

/***/ },
/* 37 */
/***/ function(module, exports) {

  module.exports = require("helmet");

/***/ },
/* 38 */
/***/ function(module, exports) {

  module.exports = require("http");

/***/ },
/* 39 */
/***/ function(module, exports) {

  module.exports = require("lastfm");

/***/ },
/* 40 */
/***/ function(module, exports) {

  module.exports = require("method-override");

/***/ },
/* 41 */
/***/ function(module, exports) {

  module.exports = require("moment");

/***/ },
/* 42 */
/***/ function(module, exports) {

  module.exports = require("morgan");

/***/ },
/* 43 */
/***/ function(module, exports) {

  module.exports = require("nodemailer");

/***/ },
/* 44 */
/***/ function(module, exports) {

  module.exports = require("numeral");

/***/ },
/* 45 */
/***/ function(module, exports) {

  module.exports = require("path");

/***/ },
/* 46 */
/***/ function(module, exports) {

  module.exports = require("paypal-rest-sdk");

/***/ },
/* 47 */
/***/ function(module, exports) {

  module.exports = require("purest");

/***/ },
/* 48 */
/***/ function(module, exports) {

  module.exports = require("querystring");

/***/ },
/* 49 */
/***/ function(module, exports) {

  module.exports = require("request");

/***/ },
/* 50 */
/***/ function(module, exports) {

  module.exports = require("semver");

/***/ },
/* 51 */
/***/ function(module, exports) {

  module.exports = require("serve-favicon");

/***/ },
/* 52 */
/***/ function(module, exports) {

  module.exports = require("socket.io");

/***/ },
/* 53 */
/***/ function(module, exports) {

  module.exports = require("tumblr");

/***/ },
/* 54 */
/***/ function(module, exports) {

  module.exports = require("twit");

/***/ }
/******/ ]);
//# sourceMappingURL=server.js.map