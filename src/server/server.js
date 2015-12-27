'use strict';

/**
 * Module Dependencies
 */

// Express 4.x Modules
import http              from 'http';
import csrf              from 'csurf';                   // https://github.com/expressjs/csurf
import morgan            from 'morgan';                  // https://github.com/expressjs/morgan
import express           from 'express';                 // https://npmjs.org/package/express
import favicon           from 'serve-favicon';           // https://github.com/expressjs/favicon
import session           from 'express-session';         // https://github.com/expressjs/session
import compress          from 'compression';             // https://github.com/expressjs/compression
import bodyParser        from 'body-parser';             // https://github.com/expressjs/body-parser
import errorHandler      from 'errorhandler';            // https://github.com/expressjs/errorhandler
import methodOverride    from 'method-override';         // https://github.com/expressjs/method-override

// Additional Modules
import fs                from 'fs';                      // http://nodejs.org/docs/v0.10.25/api/fs.html
import path              from 'path';                    // http://nodejs.org/docs/v0.10.25/api/path.html
import Debug             from 'debug';                   // https://github.com/visionmedia/debug
import flash             from 'express-flash';           // https://npmjs.org/package/express-flash
import helmet            from 'helmet';                  // https://github.com/evilpacket/helmet
import semver            from 'semver';                  // https://npmjs.org/package/semver
import enforce           from 'express-sslify';          // https://github.com/florianheinemann/express-sslify
import mongoose          from 'mongoose';                // https://npmjs.org/package/mongoose
import connectMongo      from 'connect-mongo';           // https://npmjs.org/package/connect-mongo
import expressValidator  from 'express-validator';       // https://npmjs.org/package/express-validator
import SocketIO          from 'socket.io';
import Grant             from 'grant-express';
import { requestExtensions }              from './middlewares/auth';

/**
 * Initialize variables
 */
let app = express();
let server;
let io;
const httpEnabled = ENV.http && ENV.http.enable;
const httpsEnabled = ENV.https && ENV.https.enable;
const debug = Debug(ENV.name);
const mongoStore = connectMongo(session);
const db = connectMongoDB();
const grant = Grant(ENV.OAuth);

// Use Mongo for session store
ENV.session.store  = new mongoStore({
  mongooseConnection: db,
  autoReconnect: true
});

/**
 * Configure application settings
 */

// Jade View setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Format dates/times in jade templates
app.locals.moment = require('moment');

// Format numbers in jade templates
app.locals.numeral = require('numeral');

if (app.get('env') === 'development') {
  // Jade options: Don't minify html, debug intrumentation
  app.locals.pretty = true;
  app.locals.compileDebug = true;
  // Turn on console logging in development
  app.use(morgan('dev'));
  // Turn off caching in development
  // This sets the Cache-Control HTTP header to no-store, no-cache,
  // which tells browsers not to cache anything.
  app.use(helmet.nocache());
}

if (app.get('env') === 'production') {
  // Jade options: minify html, no debug intrumentation
  app.locals.pretty = false;
  app.locals.compileDebug = false;
  // Enable If behind nginx, proxy, or a load balancer (e.g. Heroku, Nodejitsu)
  app.enable('trust proxy', 1);  // trust first proxy
  // In case of a non-encrypted HTTP request, enforce.HTTPS() automatically
  // redirects to an HTTPS address using a 301 permanent redirect. BE VERY
  // CAREFUL with this! 301 redirects are cached by browsers and should be
  // considered permanent.
  //
  // NOTE: Use `enforce.HTTPS(true)` if you are behind a proxy or load
  // balancer that terminates SSL for you (e.g. Heroku, Nodejitsu).
  app.use(enforce.HTTPS(true));

  // Turn on HTTPS/SSL cookies
  ENV.session.proxy = true;
  ENV.session.cookie.secure = true;

  app.use(helmet.contentSecurityPolicy({
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
app.post('/csp', bodyParser.json(), function (req, res) {
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
app.use(compress());

// http://en.wikipedia.org/wiki/HTTP_ETag
// Google has a nice article about "strong" and "weak" caching.
// It's worth a quick read if you don't know what that means.
// https://developers.google.com/speed/docs/best-practices/caching
app.set('etag', true);  // other values 'weak', 'strong'


// Now setup serving static assets from /public

// time in milliseconds...
var minute = 1000 * 60;   //     60000
var hour = (minute * 60); //   3600000
var day  = (hour * 24);   //  86400000
var week = (day * 7);     // 604800000

app.use(express.static(__dirname + '/public', { maxAge: week }));

// Body parsing middleware supporting
// JSON, urlencoded, and multipart requests.
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Easy form validation!
// This line must be immediately after bodyParser!
app.use(expressValidator());

// If you want to simulate DELETE and PUT
// in your app you need methodOverride.
app.use(methodOverride());

// Use sessions
// NOTE: cookie-parser not needed with express-session > v1.5
app.use(session(ENV.session));

// Security Settings
app.disable('x-powered-by');          // Don't advertise our server type
app.use(csrf());                      // Prevent Cross-Site Request Forgery
app.use(helmet.ienoopen());           // X-Download-Options for IE8+
app.use(helmet.nosniff());            // Sets X-Content-Type-Options to nosniff
app.use(helmet.xssFilter());          // sets the X-XSS-Protection header
app.use(helmet.frameguard('deny'));   // Prevent iframe clickjacking
app.use(helmet.hsts({
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
  res.locals.config = ENV;
  res.locals._csrf = req.csrfToken();
  next();
});

/** Our middlewares */
app.use(requestExtensions);

// Flash messages
app.use(flash());

// IE header
app.use(function(req, res, next) {
    res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    next();
});

/**
 * Route Controllers
 */
app.use(require('./routes').default);

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
      error: {}  // don't leak information
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
  app.use(errorHandler());
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

function connectMongoDB () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  return mongoose.connect(ENV.mongodb.url).connection;
}


function startApp() {
    var port = httpsEnabled && ENV.https.port ||
               httpEnabled && ENV.http.port;

    var host = httpsEnabled && ENV.https.host ||
               httpEnabled && ENV.http.host || '0.0.0.0';


    app.set('host', host);
    app.set('port', port);

    // Create the server
    if (httpsEnabled) {
         server = https.createServer({
            key: fs.readFileSync(ENV.https.key),
            cert: fs.readFileSync(ENV.https.cert)
        }, app);
        io = SocketIO(server);
    } else {
        server = http.createServer(app);
        io = SocketIO(server);
    }
    
    // Provide access to the socket server in your controllers
    app.set('io', io);

    if (httpsEnabled && httpEnabled) {
        // Create an HTTP -> HTTPS redirect server
        var redirectServer = express();
        redirectServer.get('*', function(req, res) {
            var urlPort = port === 80 ? '' : ':' + port;
            res.redirect('https://' + req.hostname + urlPort + req.path);
        });
        http.createServer(redirectServer)
            .listen(ENV.http.port || 5000, host, listen);
    }

    server.listen(port, host, listen);
}

function listen () {
  // Log how we are running
  console.log(`The server is running at http://${app.get('host')}:${app.get('port')}/`);
  console.log('Ctrl+C' + ' to shut down. ;)\n');

  // Exit cleanly on Ctrl+C
  process.on('SIGINT', function () {
    io.close();  // close socket.io
    console.log('\n');
    console.log('has ' + 'shutdown');
    console.log('was running for ' + Math.round(process.uptime()).toString() + ' seconds.');
    process.exit(0);
  });
}

export default server;
