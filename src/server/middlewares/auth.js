/**
 * Login Required middleware.
 */

export const isAuthenticated = function (req, res, next) {
  // Is the user authenticated?
  if (req.isAuthenticated()) {
    // Does the user have enhanced security enabled?
    if (req.user.enhancedSecurity.enabled) {
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
    req.session.attemptedURL = req.url;  // Save URL so we can redirect to it after authentication
    res.set('X-Auth-Required', 'true');
    req.flash('error', { msg: 'You must be logged in to reach that page.' });
    res.redirect('/login');
  }
};

/**
 * Authorization Required middleware.
 */

export const isAuthorized = function (req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];
  if (_.find(req.user.tokens, { kind: provider })) {
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

export const isAdministrator = function (req, res, next) {
  // make sure we are logged in first
  if (req.isAuthenticated()) {
    // user must be be an administrator
    if (req.user.type !== 'admin') {
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

export const isSecure = function (req, res, next) {
  // Reroute HTTP traffic to HTTPS
  if ((req.secure) || (req.headers['x-forwarded-proto'] === 'https')) {
    return next();
  } else {
    res.redirect('https://' + req.headers.host + req.url);
  }
};