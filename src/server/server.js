/**
 * Module Dependencies
 */
import 'babel-core/polyfill';

// Express 4.x Modules
import http              from 'http';
import https             from 'https';
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
import config            from '../../config/config';     // Get configuration file
import helmet            from 'helmet';                  // https://github.com/evilpacket/helmet
import semver            from 'semver';                  // https://npmjs.org/package/semver
import enforce           from 'express-sslify';          // https://github.com/florianheinemann/express-sslify
import mongoose          from 'mongoose';                // https://npmjs.org/package/mongoose
import passport          from 'passport';                // https://npmjs.org/package/passport
import MongoStore        from 'connect-mongo';           // https://npmjs.org/package/connect-mongo
import expressValidator  from 'express-validator';       // https://npmjs.org/package/express-validator
import SocketIO          from 'socket.io';

import indexController from './routes/index';
import playerEventsController from './routes/api/playerEvents';

const ssl_options = {
  key: fs.readFileSync(path.join(__dirname, process.env.SSL_KEY)),
  cert: fs.readFileSync(path.join(__dirname, process.env.SSL_CERT))
};

/**
 * Setup the HTTP/S and socket servers
 */
const server = express();
const httpServer = http.createServer(server);
const httpsServer = https.createServer(ssl_options, server);
const io = SocketIO(httpsServer);

const debug = Debug(config.appName);
const mongoStore = MongoStore(session);

server.set('socketio', io);

/**
 * Configure Mongo Database
 */

const db = connect();

// Use Mongo for session store
config.session.store  = new mongoStore({
  mongooseConnection: db,
  autoReconnect: true
});

// Format dates/times in jade templates
// Use moment anywhere within a jade template like this:
// p #{moment(Date.now()).format('MM/DD/YYYY')}
// http://momentjs.com/
// Good for an evergreen copyright ;)
server.locals.moment = require('moment');

// Format numbers in jade templates:
// Use numeral anywhere within a jade template like this:
// #{numeral('123456').format('$0,0.00')}
// http://numeraljs.com/
server.locals.numeral = require('numeral');

if (server.get('env') === 'development') {
  // Jade options: Don't minify html, debug intrumentation
  server.locals.pretty = true;
  server.locals.compileDebug = true;
  // Turn on console logging in development
  server.use(morgan('dev'));
  // Turn off caching in development
  // This sets the Cache-Control HTTP header to no-store, no-cache,
  // which tells browsers not to cache anything.
  server.use(helmet.nocache());
}

if (server.get('env') === 'production') {
  // Jade options: minify html, no debug intrumentation
  server.locals.pretty = false;
  server.locals.compileDebug = false;
  // Enable If behind nginx, proxy, or a load balancer (e.g. Heroku, Nodejitsu)
  server.enable('trust proxy', 1);  // trust first proxy
  // Since our serverlication has signup, login, etc. forms these should be protected
  // with SSL encryption. Heroku, Nodejitsu and other hosters often use reverse
  // proxies or load balancers which offer SSL endpoints (but then forward unencrypted
  // HTTP traffic to the server).  This makes it simpler for us since we don't have to
  // setup HTTPS in express. When in production we can redirect all traffic to SSL
  // by using a little middleware.
  //
  // In case of a non-encrypted HTTP request, enforce.HTTPS() automatically
  // redirects to an HTTPS address using a 301 permanent redirect. BE VERY
  // CAREFUL with this! 301 redirects are cached by browsers and should be
  // considered permanent.
  //
  // NOTE: Use `enforce.HTTPS(true)` if you are behind a proxy or load
  // balancer that terminates SSL for you (e.g. Heroku, Nodejitsu).
  server.use(enforce.HTTPS(true));
  // This tells browsers, "hey, only use HTTPS for the next period of time".
  // This will set the Strict Transport Security header, telling browsers to
  // visit by HTTPS for the next ninety days:
  // TODO: should we actually have this *and* server.use(enforce.HTTPS(true)); above?
  //       this seems more flexible rather than a hard redirect.
  var ninetyDaysInMilliseconds = 7776000000;
  server.use(helmet.hsts({ maxAge: ninetyDaysInMilliseconds }));
  // Turn on HTTPS/SSL cookies
  config.session.proxy = true;
  config.session.cookie.secure = true;
}

server.set('port', config.port);
server.set('httpsPort', config.httpsPort);

// Favicon - This middleware will come very early in your stack
// (maybe even first) to avoid processing any other middleware
// if we already know the request is for favicon.ico
//server.use(favicon(__dirname + '/public/favicon.ico'));

// Report CSP violations (*ABOVE* CSURF in the middleware stack)
// Browsers will post violations to this route
// https://mathiasbynens.be/notes/csp-reports
server.post('/csp', bodyParser.json(), function (req, res) {
  // TODO - requires production level logging
  if (req.body) {
    // Just send to debug to see if this is working
    debug('CSP Violation: ' + JSON.stringify(req.body));
  } else {
    debug('CSP Violation: No data received!');
  }
  res.status(204).end();
});

server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'jade');

// Compress response data with gzip / deflate.
// This middleware should be placed "high" within
// the stack to ensure all responses are compressed.
server.use(compress());

// http://en.wikipedia.org/wiki/HTTP_ETag
// Google has a nice article about "strong" and "weak" caching.
// It's worth a quick read if you don't know what that means.
// https://developers.google.com/speed/docs/best-practices/caching
server.set('etag', true);  // other values 'weak', 'strong'


// Now setup serving static assets from /public

// time in milliseconds...
var minute = 1000 * 60;   //     60000
var hour = (minute * 60); //   3600000
var day  = (hour * 24);   //  86400000
var week = (day * 7);     // 604800000

server.use(express.static(__dirname + '/public', { maxAge: week }));

// Body parsing middleware supporting
// JSON, urlencoded, and multipart requests.
// parse application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: true }));

// Easy form validation!
// This line must be immediately after bodyParser!
server.use(expressValidator());

// If you want to simulate DELETE and PUT
// in your app you need methodOverride.
server.use(methodOverride());

// Use sessions
// NOTE: cookie-parser not needed with express-session > v1.5
server.use(session(config.session));

// Security Settings
server.disable('x-powered-by');          // Don't advertise our server type
server.use(csrf());                      // Prevent Cross-Site Request Forgery
server.use(helmet.ienoopen());           // X-Download-Options for IE8+
server.use(helmet.nosniff());            // Sets X-Content-Type-Options to nosniff
server.use(helmet.xssFilter());          // sets the X-XSS-Protection header
server.use(helmet.frameguard('deny'));   // Prevent iframe clickjacking

// Passport OAUTH Middleware
server.use(passport.initialize());
server.use(passport.session());

// Keep user, csrf token and config available
server.use(function (req, res, next) {
  res.locals.user = req.user;
  res.locals.config = config;
  res.locals._csrf = req.csrfToken();
  next();
});

/**
 * Routes/Routing
 */

server.use('/', indexController);
server.use('/api/playerEvents', playerEventsController);

/**
 * Error Handling
 */

// If nothing responded above we will assume a 404
// (since no routes responded or static assets found)

// Tests:
//   $ curl http://localhost:3000/notfound
//   $ curl http://localhost:3000/notfound -H "Accept: application/json"
//   $ curl http://localhost:3000/notfound -H "Accept: text/plain"

// Handle 404 Errors
server.use(function (req, res, next) {
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
server.use(function (err, req, res, next) {
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
if (server.get('env') === 'production') {
  server.use(function (err, req, res, next) {
    res.status(err.status || 500);
    debug('Error: ' + (err.status || 500).toString() + ' ' + err);
    res.render('error/500', {
      error: {}  // don't leak information
    });
  });
}

// Development 500 error handler
if (server.get('env') === 'development') {
  server.use(function (err, req, res, next) {
    res.status(err.status || 500);
    debug('Error: ' + (err.status || 500).toString() + ' ' + err);
    res.render('error/500', {
      error: err
    });
  });

  // Final error catch-all just in case...
  server.use(errorHandler());
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

db.on('error', function () {
  debug('MongoDB Connection Error. Please make sure MongoDB is running.');
  process.exit(0);
});

db.on('open', function () {
  debug('Mongodb ' + 'connected!');

  // "server.listen" for socket.io
  httpServer.listen(server.get('port'), listen);
  httpsServer.listen(server.get('httpsPort'), listen);
});

// Reconnect on disconnect
db.on('disconnected', connect);

/**
 * Emit Pageviews on Socket.io for Dashboard
 *
 *   Web Page (Client) --->> ( `pageview` messages ) --->> Server
 *   Web Page (Client) <<--- (`dashUpdate` messages) <<--- Server
 */

var connectedCount = 0;

io.on('connection', function (socket) {
  connectedCount += 1;
  // Listen for pageview messages from clients
  socket.on('pageview', function (message) {
    var ip = socket.handshake.headers['x-forwarded-for'] || socket.client.conn.remoteAddress || socket.handshake.address;
    var url = message;
    // Broadcast dashboard update (to all clients in default namespace)
    io.emit('dashUpdate', {
      connections: connectedCount,
      ip: ip,
      url: url,
      timestamp: new Date()
    });
  });
  // Update dashboard connections on disconnect events
  socket.on('disconnect', function () {
    connectedCount -= 1;
    io.emit('dashUpdate', {
      connections: connectedCount
    });
  });
});

function connect () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  return mongoose.connect(config.mongodb.url).connection;
}

function listen () {
  // Log how we are running
  console.log('listening in ' + server.settings.env + ' mode.');
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
