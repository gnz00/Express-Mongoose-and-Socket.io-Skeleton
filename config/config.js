'use strict';

/**
 * Module Dependencies
 */

var pkg               = require('../package.json');
var dotenv            = require('dotenv');  // https://www.npmjs.com/package/dotenv

// *For Development Purposes*
// Read in environment vars from .env file
// In production I recommend setting the
// environment vars directly
dotenv.load();

/**
 * Configuration File
 *
 * Why like this?
 *
 *  - All environmental variables documented in one place
 *  - If I use "." notation it's easy to cut/paste into code
 *  - Unlike JSON, javascript allows comments (which I like)
 *  - Reading package.json here centralizes all config info
 *
 */

var config            = {};

// From package.json
config.name           = pkg.name;
config.version        = pkg.version;
config.description    = pkg.description;
config.company        = pkg.company;
config.author         = pkg.author;
config.keywords       = pkg.keywords;
config.engine         = pkg.engines.node || pkg.engines.iojs;

config.appName        = process.env.APP_NAME || 'SkeletonApp';
config.port           = process.env.PORT || 80;
config.httpsPort      = process.env.HTTPS_PORT || 443;
config.ga             = process.env.GA   || 'google analytics key';

/**
 * Logging Configuration
 */

config.logging        = process.env.LOGGING || false;

/**
 * Database Configuration
 */

config.mongodb        = {};
config.mongodb.user    = process.env.MONGODB_USER || 'localhost';
config.mongodb.password    = process.env.MONGODB_PASSWORD || 'localhost';
config.mongodb.host    = process.env.MONGODB_HOST || 'localhost';
config.mongodb.port    = process.env.MONGODB_PORT || 27335;
config.mongodb.name    = process.env.MONGODB_NAME || 'SampleApp';
config.mongodb.url    = process.env.MONGODB_URL || `mongodb://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.name}`;

/**
 * Session Configuration
 */

var hour              = 3600000;
var day               = (hour * 24);
var week              = (day * 7);

// Session
config.session                 = {};
config.session.secret          = process.env.SESSION_SECRET || 'my big secret';
config.session.name            = 'sid';  // Generic - don't leak information
config.session.proxy           = false;  // Trust the reverse proxy for HTTPS/SSL
config.session.resave          = false;  // Forces session to be saved even when unmodified
config.session.saveUninitialized = false; // forces a session that is "uninitialized" to be saved to the store
config.session.cookie          = {};
config.session.cookie.httpOnly = true;   // Reduce XSS attack vector
config.session.cookie.secure   = false;  // Cookies via HTTPS/SSL
config.session.cookie.maxAge   = process.env.SESSION_MAX_AGE || week;

/**
 * Throttle Login Attempts
 */

config.loginAttempts           = {};
config.loginAttempts.forIp     = 50;
config.loginAttempts.forUser   = 5;
config.loginAttempts.expires   = '20m';

/**
 * Mailing Configuration
 */

// Who are we sending email as?
config.smtp                    = {};
config.smtp.name               = process.env.SMTP_FROM_NAME    || 'support';
config.smtp.address            = process.env.SMTP_FROM_ADDRESS || 'support@skeleton.com';

// How are we sending it?
config.gmail                   = {};
config.gmail.user              = process.env.SMTP_USERNAME || 'you@gmail.com';
config.gmail.password          = process.env.SMTP_PASSWORD || 'appspecificpassword';

/**
 * Authorization Configuration
 */

config.localAuth               = true;
config.verificationRequired    = false;  // on/off for user email verification at signup
config.enhancedSecurity        = true;   // on/off for two factor authentication

// Facebook
config.facebookAuth            = true;
config.facebook                = {};
config.facebook.clientID       = process.env.FACEBOOK_KEY    || 'Your Key';
config.facebook.clientSecret   = process.env.FACEBOOK_SECRET || 'Your Secret';

// Github
config.githubAuth              = true;
config.github                  = {};
config.github.clientID         = process.env.GITHUB_KEY    || 'Your Key';
config.github.clientSecret     = process.env.GITHUB_SECRET || 'Your Secret';

// Twitter
config.twitterAuth             = true;
config.twitter                 = {};
config.twitter.consumerKey     = process.env.TWITTER_KEY    || 'Your Key';
config.twitter.consumerSecret  = process.env.TWITTER_SECRET || 'Your Secret';

// Google
config.googleAuth              = true;
config.google                  = {};
config.google.clientID         = process.env.GOOGLE_KEY    || 'Your Key';
config.google.clientSecret     = process.env.GOOGLE_SECRET || 'Your Secret';

module.exports = config;