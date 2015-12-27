'use strict';

/**
 * Module Dependencies
 */

import { Router } from 'express';
import User from '../models/User';
import Async from 'async';
import Crypto from 'crypto';
import NodeMailer from 'nodemailer';
import LoginAttempt from '../models/LoginAttempt';

/**
 * User Controller
 */

const router = new Router();


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
  var workflow = new (require('events').EventEmitter)();

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

    var getIpCount = function (done) {
      var conditions = { ip: req.ip };
      LoginAttempt.count(conditions, function (err, count) {
        if (err) {
          return done(err);
        }
        done(null, count);
      });
    };

    var getIpUserCount = function (done) {
      var conditions = { ip: req.ip, user: req.body.email.toLowerCase() };
      LoginAttempt.count(conditions, function (err, count) {
        if (err) {
          return done(err);
        }
        done(null, count);
      });
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (results.ip >= ENV.loginAttempts.forIp || results.ipUser >= ENV.loginAttempts.forUser) {
        req.flash('error', { msg: 'You\'ve reached the maximum number of login attempts. Please try again later or reset your password.' });
        req.session.tooManyAttempts = true;
        return res.redirect('/login');
      }
      else {
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
        LoginAttempt.create(fieldsToSet, function (err, doc) {
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
  var workflow = new (require('events').EventEmitter)();

  /**
   * Step 1: Validate the user and token
   */

  workflow.on('validate', function () {

    // Get the user using their ID and token
    User.findOne({ _id: req.params.id, verifyToken: req.params.token }, function (err, user) {
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
    var transporter = NodeMailer.createTransport({
      service: 'Gmail',
      auth: {
        user: ENV.gmail.user,
        pass: ENV.gmail.password
      }
    });

    // Render HTML to send using .jade mail template (just like rendering a page)
    res.render('mail/welcome', {
      name:          user.profile.name,
      mailtoName:    ENV.smtp.name,
      mailtoAddress: ENV.smtp.address,
      blogLink:      req.protocol + '://' + req.headers.host, // + '/blog',
      forumLink:     req.protocol + '://' + req.headers.host  // + '/forum'
    }, function (err, html) {
      if (err) {
        return (err, null);
      }
      else {

        // Now create email text (multiline string as array FTW)
        var text = [
          'Hello ' + user.profile.name + '!',
          'We would like to welcome you as our newest member!',
          'Thanks so much for using our services! If you have any questions, or suggestions, feel free to email us here at ' + ENV.smtp.address + '.',
          'If you want to get the latest scoop check out our <a href="' +
          req.protocol + '://' + req.headers.host + '/blog' +
          '">blog</a> and our <a href="' +
          req.protocol + '://' + req.headers.host + '/forums">forums</a>.',
          '  - The ' + ENV.smtp.name + ' team'
        ].join('\n\n');

        // Create email
        var mailOptions = {
          to:       user.profile.name + ' <' + user.email + '>',
          from:     ENV.smtp.name + ' <' + ENV.smtp.address + '>',
          subject:  'Welcome to ' + req.app.locals.application + '!',
          text:     text,
          html:     html
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
  var workflow = new (require('events').EventEmitter)();

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

    if (ENV.verificationRequired) {
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
    var user = new User({
      'profile.name': req.body.name.trim(),
      email:          req.body.email.toLowerCase(),
      password:       req.body.password,
      verifyToken:    verifyToken,
      verified:       verified
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
        if (ENV.verificationRequired) {
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
    var transporter = NodeMailer.createTransport({
      service: 'Gmail',
      auth: {
        user: ENV.gmail.user,
        pass: ENV.gmail.password
      }
    });

    // Render HTML to send using .jade mail template (just like rendering a page)
    res.render('mail/accountVerification', {
      name:          user.profile.name,
      mailtoName:    ENV.smtp.name,
      validateLink:  req.protocol + '://' + req.headers.host + '/verify/' + user.id + '/' + verifyToken
    }, function (err, html) {
      if (err) {
        return (err, null);
      }
      else {

        // Now create email text (multiline string as array FTW)
        var text = [
          'Hello ' + user.profile.name + '!',
          'Welcome to ' + req.app.locals.application + '!  Here is a special link to activate your new account:',
          req.protocol + '://' + req.headers.host + '/verify/' + user.id + '/' + user.verifyToken,
          '  - The ' + ENV.smtp.name + ' team'
        ].join('\n\n');

        // Create email
        var mailOptions = {
          to:       user.profile.name + ' <' + user.email + '>',
          from:     ENV.smtp.name + ' <' + ENV.smtp.address + '>',
          subject:  'Activate your new ' + req.app.locals.application + ' account',
          text:     text,
          html:     html
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
    var transporter = NodeMailer.createTransport({
      service: 'Gmail',
      auth: {
        user: ENV.gmail.user,
        pass: ENV.gmail.password
      }
    });

    // Render HTML to send using .jade mail template (just like rendering a page)
    res.render('mail/welcome', {
      name:          user.profile.name,
      mailtoName:    ENV.smtp.name,
      mailtoAddress: ENV.smtp.address,
      blogLink:      req.protocol + '://' + req.headers.host, // + '/blog',
      forumLink:     req.protocol + '://' + req.headers.host  // + '/forum'
    }, function (err, html) {
      if (err) {
        return (err, null);
      }
      else {

        // Now create email text (multiline string as array FTW)
        var text = [
          'Hello ' + user.profile.name + '!',
          'We would like to welcome you as our newest member!',
          'Thanks so much for using our services! If you have any questions, or suggestions, feel free to email us here at ' + ENV.smtp.address + '.',
          'If you want to get the latest scoop check out our <a href="' +
          req.protocol + '://' + req.headers.host + '/blog' +
          '">blog</a> and our <a href="' +
          req.protocol + '://' + req.headers.host + '/forums">forums</a>.',
          '  - The ' + ENV.smtp.name + ' team'
        ].join('\n\n');

        // Create email
        var mailOptions = {
          to:       user.profile.name + ' <' + user.email + '>',
          from:     ENV.smtp.name + ' <' + ENV.smtp.address + '>',
          subject:  'Welcome to ' + req.app.locals.application + '!',
          text:     text,
          html:     html
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
      if (ENV.twoFactor) {
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
  var workflow = new (require('events').EventEmitter)();

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
    User.findOne({ email: req.body.email.toLowerCase() }, function (err, user) {
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
    var user = new User();

    user.verified         = true;  // social users don't require verification
    user.email            = req.body.email.toLowerCase();
    user.profile.name     = newUser.profile.name;
    user.profile.gender   = newUser.profile.gender;
    user.profile.location = newUser.profile.location;
    user.profile.website  = newUser.profile.website;
    user.profile.picture  = newUser.profile.picture;

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
    var transporter = NodeMailer.createTransport({
      service: 'Gmail',
      auth: {
        user: ENV.gmail.user,
        pass: ENV.gmail.password
      }
    });

    // Render HTML to send using .jade mail template (just like rendering a page)
    res.render('mail/welcome', {
      name:          user.profile.name,
      mailtoName:    ENV.smtp.name,
      mailtoAddress: ENV.smtp.address,
      blogLink:      req.protocol + '://' + req.headers.host, // + '/blog',
      forumLink:     req.protocol + '://' + req.headers.host  // + '/forum'
    }, function (err, html) {
      if (err) {
        return (err, null);
      }
      else {

        // Now create email text (multiline string as array FTW)
        var text = [
          'Hello ' + user.profile.name + '!',
          'We would like to welcome you as our newest member!',
          'Thanks so much for using our services! If you have any questions, or suggestions, feel free to email us here at ' + ENV.smtp.address + '.',
          'If you want to get the latest scoop check out our <a href="' +
          req.protocol + '://' + req.headers.host + '/blog' +
          '">blog</a> and our <a href="' +
          req.protocol + '://' + req.headers.host + '/forums">forums</a>.',
          '  - The ' + ENV.smtp.name + ' team'
        ].join('\n\n');

        // Create email
        var mailOptions = {
          to:       user.profile.name + ' <' + user.email + '>',
          from:     ENV.smtp.name + ' <' + ENV.smtp.address + '>',
          subject:  'Welcome to ' + req.app.locals.application + '!',
          text:     text,
          html:     html
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

export default router;

