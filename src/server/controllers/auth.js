'use strict';

/**
 * Module Dependencies
 */

import { Router } from 'express';
import User from '../models/User';
import _ from 'lodash';
import { GoogleProvider } from '../services/auth';

/**
 * Auth Controller
 */

const router = new Router();

/**
 * Google Authentication
 * Utilize 3 different libraries just for OAuth.
 *
 * 1. Using Grant to handle standardizing the initial token rest
 * 2. Using GoogleAuthLibrary to verify the id token (using it because it will cache the cert files)
 * 3. Using Purest to retrieve the profile info on registration
 */

router.get('/auth/google/callback', function (req, res, next) {

  let google = new GoogleProvider(res.locals.config.OAuth.google);
  let oAuthPayload = req.session.grant.response.raw;

  google.verifyIdToken(oAuthPayload.id_token)
  .then(async (payload) => {

    let user = await User.findOne({ google: payload['sub'] });

    if (user) {
      user.activity.last_logon = Date.now();
      await user.saveAsync();
      await req.login(user);
      // Send user on their merry way
      if (req.session.attemptedURL) {
        console.log('Sending user to attemptedURL');
        var redirectURL = req.session.attemptedURL;
        delete req.session.attemptedURL;
        return res.redirect(redirectURL);
      } else {
        console.log('User authenticated, going to /api');
        return res.redirect('/api');
      }

    } else {
      console.log('No user found, creating a new user');
      let profile = await google.getCurrentProfile(oAuthPayload.access_token);
      console.log(profile);
      req.session.socialProfile = google.serializeUser(profile);
      req.session.socialProfile['accessToken'] = oAuthPayload.access_token;
      req.session.socialProfile['refreshToken'] = oAuthPayload.refresh_token;
      console.log(req.session.socialProfile);
      return res.render('account/signupsocial', { email: req.session.socialProfile.email });
    }
  })
  .catch((error) => {
    console.log(error.stack);
    return next(error);
  });

});

export default router;
