'use strict';

/**
 * Module Dependencies
 */

var _             = require('lodash');
var Twit          = require('twit');
var async         = require('async');
var debug         = require('debug')('skeleton');       // https://github.com/visionmedia/debug
var graph         = require('fbgraph');
var tumblr        = require('tumblr');
var Github        = require('github-api');
var paypal        = require('paypal-rest-sdk');
var cheerio       = require('cheerio');         // https://github.com/cheeriojs/cheerio
var request       = require('request');         // https://github.com/mikeal/request
var LastFmNode    = require('lastfm').LastFmNode;
var querystring   = require('querystring');
import {Router} from 'express';

import { isAuthenticated, isAuthorized } from '../middlewares/auth';

/**
 * API Controller
 */
const router = new Router();


/**
 * GET /api*
 * *ALL* api routes must be authenticated first
 */

router.all('/api*', isAuthenticated);

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
  var lastfm = new LastFmNode(ENV.lastfm);
  async.parallel({

    artistInfo: function (done) {
      lastfm.request('artist.getInfo', {
        artist: 'Morcheeba',
        handlers: {
          success: function (data) {
            done(null, data);
          },
          error: function (err) {
            done(err);
          }
        }
      });
    },

    artistTopAlbums: function (done) {
      lastfm.request('artist.getTopAlbums', {
        artist: 'Morcheeba',
        handlers: {
          success: function (data) {
            var albums = [];
            _.forEach(data.topalbums.album, function (album) {
              albums.push(album.image.slice(-1)[0]['#text']);
            });
            done(null, albums.slice(0, 4));
          },
          error: function (err) {
            done(err);
          }
        }
      });
    }
  },

  function (err, results) {
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
  var query = querystring.stringify({ 'api-key': ENV.nyt.key, 'list-name': 'young-adult' });
  var url = 'http://api.nytimes.com/svc/books/v2/lists?' + query;
  request.get(url, function (error, request, body) {
    if (request.statusCode === 403) {
      return next(error('Missing or Invalid New York Times API Key'));
    }
    var bestsellers = {};
    // NYT occasionally sends bad data :(
    try {
      bestsellers = JSON.parse(body);
    }
    catch (err) {
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
  paypal.configure(ENV.paypal);
  var payment_details = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: ENV.paypal.returnUrl,
      cancel_url: ENV.paypal.cancelUrl
    },
    transactions: [
      {
        description: 'ITEM: Something Awesome!',
        amount: {
          currency: 'USD',
          total: '2.99'
        }
      }
    ]
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
    from: ENV.twilio.phone,
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

router.get('/api/foursquare', isAuthenticated, isAuthorized, function (req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'foursquare' });
  async.parallel({
    trendingVenues: function (callback) {
      foursquare.Venues.getTrending('40.7222756', '-74.0022724', { limit: 50 }, token.accessToken, function (err, results) {
        callback(err, results);
      });
    },
    venueDetail: function (callback) {
      foursquare.Venues.getVenue('49da74aef964a5208b5e1fe3', token.accessToken, function (err, results) {
        callback(err, results);
      });
    },
    userCheckins: function (callback) {
      foursquare.Users.getCheckins('self', null, token.accessToken, function (err, results) {
        callback(err, results);
      });
    }
  },
  function (err, results) {
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

router.get('/api/tumblr', isAuthenticated, isAuthorized, function (req, res) {
  var token = _.find(req.user.tokens, { kind: 'tumblr' });
  var client = tumblr.createClient({
    consumer_key: ENV.tumblr.key,
    consumer_secret: ENV.tumblr.secret,
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

router.get('/api/facebook', isAuthenticated, isAuthorized, function (req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  async.parallel({
    getMe: function (done) {
      graph.get(req.user.facebook, function (err, me) {
        done(err, me);
      });
    },
    getMyFriends: function (done) {
      graph.get(req.user.facebook + '/friends', function (err, friends) {
        debug('Friends: ' + JSON.stringify(friends));
        done(err, friends);
      });
    }
  },
  function (err, results) {
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

router.get('/api/github', isAuthenticated, isAuthorized, function (req, res) {
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

router.get('/api/twitter', isAuthenticated, isAuthorized, function (req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var params = { q: 'iPhone 6', since_id: 24012619984051000, count: 10, result_type: 'popular' };
  var T = new Twit({
    consumer_key:         ENV.twitter.consumerKey,
    consumer_secret:      ENV.twitter.consumerSecret,
    access_token:         token.token,
    access_token_secret:  token.tokenSecret
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

router.post('/api/twitter', isAuthenticated, isAuthorized, function (req, res, next) {
  req.assert('tweet', 'Tweet cannot be empty.').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twitter');
  }
  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var T = new Twit({
    consumer_key:         ENV.twitter.consumerKey,
    consumer_secret:      ENV.twitter.consumerSecret,
    access_token:         token.token,
    access_token_secret:  token.tokenSecret
  });
  T.post('statuses/update', { status: req.body.tweet }, function (err, data, response) {
    if (err) {
      return next(err);
    }
    req.flash('success', { msg: 'Tweet has been posted.' });
    res.redirect('/api/twitter');
  });
});

export default router;

