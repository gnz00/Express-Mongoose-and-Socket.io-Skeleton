'use strict';

/**
 * Module dependencies.
 */
import _ from 'lodash';
import User from '../models/User';
import { capitalize } from './utils';

import Passport from 'passport';
import config from '../config';

/** Passport Auth Providers */
import Totp from 'passport-totp';
import Local from 'passport-local';
import OAuth from 'passport-oauth';
import GitHub from 'passport-github';
import Google from 'passport-google-oauth';
import Twitter from 'passport-twitter';
import Facebook from 'passport-facebook';
import HttpBearer from 'passport-http-bearer';

/**
 * Serialize and Deserialize the User
 * Passport session setup.
 *   To support persistent login sessions, Passport needs to be able to
 *   serialize users into and deserialize users out of the session.  Typically,
 *   this will be as simple as storing the user ID when serializing, and finding
 *   the user by ID when deserializing.
 */

Passport.serializeUser(function (user, done) {
  done(null, user.id);
});

Passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

/**
 * Local authentication
 */

Passport.use(new Local.Strategy({ usernameField: 'email' }, function (email, password, done) {
  User.findOne({ email: email }, function (err, user) {
    if (!user) {
      return done(null, false, { message: 'Invalid email or password.' });
    }

    // Only authenticate if the user is verified
    if (user.verified) {
      user.comparePassword(password, function (err, isMatch) {
        if (isMatch) {

          // update the user's record with login timestamp
          user.activity.last_logon = Date.now();
          user.save(function (err) {
            if (err) {
              return (err);
            }
          });

          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid email or password.' });
        }
      });
    } else {
      return done(null, false, { message: 'Your account must be verified first!' });
    }
  });
}));

/**
 * Serialize and Deserialize the User
 *   The TOTP authentication strategy authenticates a user using a TOTP value
 *   generated by a hardware device or software application (known as a token).
 *   The strategy requires a setup callback. The setup callback accepts a previously
 *   authenticated user and calls done providing a key and period used to verify
 *   the HOTP value. Authentication fails if the value is not verified.
 */

Passport.use(new Totp.Strategy(function (user, done) {
  // setup function, supply key and period to done callback
  User.findById(user.id, function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { message: 'User not found' });
    } else {
      return done(null, user.enhancedSecurity.token, user.enhancedSecurity.period);
    }
  });
}));

/**
 * Sign in with Facebook.
 */

Passport.use('facebook', new Facebook.Strategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  scope: ['email', 'user_location']
}, function (accessToken, refreshToken, profile, done) {
  done(null, false, {
    accessToken: accessToken,
    refreshToken: refreshToken,
    profile: profile
  });
}));

/**
 * Sign in with GitHub.
 */

Passport.use('github', new GitHub.Strategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  customHeaders: { 'User-Agent': config.name }
}, function (accessToken, refreshToken, profile, done) {
  done(null, false, {
    accessToken: accessToken,
    refreshToken: refreshToken,
    profile: profile
  });
}));

/**
 * Sign in with Twitter. (OAuth 1.0a)
 * NOTE: different function args!
 */

Passport.use('twitter', new Twitter.Strategy({
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret
}, function (token, tokenSecret, profile, done) {
  done(null, false, {
    token: token,
    tokenSecret: tokenSecret,
    profile: profile
  });
}));

/**
 * Sign in with Google. (OAuth 2.0)
 */

Passport.use('google', new Google.OAuth2Strategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL
}, function (accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
}));

/**
 * Tumblr API
 * Uses OAuth 1.0a Strategy.
 */

Passport.use('tumblr', new OAuth.OAuthStrategy({
  requestTokenURL: 'http://www.tumblr.com/oauth/request_token',
  accessTokenURL: 'http://www.tumblr.com/oauth/access_token',
  userAuthorizationURL: 'http://www.tumblr.com/oauth/authorize',
  consumerKey: config.tumblr.key,
  consumerSecret: config.tumblr.secret,
  callbackURL: config.tumblr.callbackURL,
  passReqToCallback: true
}, function (req, token, tokenSecret, profile, done) {
  User.findById(req.user._id, function (err, user) {
    user.tokens.push({ kind: 'tumblr', token: token, tokenSecret: tokenSecret });
    user.save(function (err) {
      done(err, user);
    });
  });
}));

/**
 * Foursquare API
 * Uses OAuth 2.0 Strategy.
 */

Passport.use('foursquare', new OAuth.OAuth2Strategy({
  authorizationURL: 'https://foursquare.com/oauth2/authorize',
  tokenURL: 'https://foursquare.com/oauth2/access_token',
  clientID: config.foursquare.clientId,
  clientSecret: config.foursquare.clientSecret,
  callbackURL: config.foursquare.redirectUrl,
  passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
  User.findById(req.user._id, function (err, user) {
    user.tokens.push({ kind: 'foursquare', accessToken: accessToken });
    user.save(function (err) {
      done(err, user);
    });
  });
}));

/**
 * HttpBearer
 * For exposing an API service
 */

Passport.use(new HttpBearer.Strategy(
  function(token, cb) {
    User.findByToken(token, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      return cb(null, user);
    });
  })
);

export default Passport;