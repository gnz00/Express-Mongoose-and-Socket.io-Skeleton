'use strict';

/**
 * Module Dependencies
 */

import { Router } from 'express';
import User from '../models/User';

/**
 * Auth Controller
 */

const router = new Router();

/**
 * Facebook Authentication
 */

// router.get('/auth/facebook/callback', function (req, res, next) {
//   Passport.authenticate('facebook', {
//     callbackURL: '/auth/facebook/callback',
//     failureRedirect: '/login'
//   }, function (err, user, info) {

//     // Check for data
//     if (!info || !info.profile) {
//       req.flash('error', { msg: 'We have no data. Something went wrong!' });
//       return res.redirect('/login');
//     }

//     // Do we already have a user with this Facebook ID?
//     // If so, then it's just a login - timestamp it.
//     User.findOne({ facebook: info.profile._json.id }, function (err, justLogin) {
//       if (err) {
//         return next(err);
//       }
//       if (justLogin) {
//         // Update the user's record with login timestamp
//         justLogin.activity.last_logon = Date.now();
//         justLogin.save(function (err) {
//           if (err) {
//             return next(err);
//           }
//           // Log the user in
//           req.login(justLogin, function (err) {
//             if (err) {
//               return next(err);
//             }

//             // Send user on their merry way
//             if (req.session.attemptedURL) {
//               var redirectURL = req.session.attemptedURL;
//               delete req.session.attemptedURL;
//               return res.redirect(redirectURL);
//             } else {
//               return res.redirect('/api');
//             }

//           });
//         });
//       } else {
//         // Brand new Facebook user!
//         // Save their profile data into the session
//         var newSocialUser               = {};

//         newSocialUser.source            = 'facebook';
//         newSocialUser.id                = info.profile._json.id;
//         newSocialUser.accessToken       = info.accessToken;
//         newSocialUser.refreshToken      = info.refreshToken;
//         newSocialUser.email             = info.profile._json.email;

//         newSocialUser.profile           = {};

//         newSocialUser.profile.name      = info.profile._json.name;
//         newSocialUser.profile.gender    = info.profile._json.gender;
//         newSocialUser.profile.location  = info.profile._json.location.name;
//         newSocialUser.profile.website   = info.profile._json.link;
//         newSocialUser.profile.picture   = 'https://graph.facebook.com/' + info.profile.id + '/picture?type=large';

//         req.session.socialProfile = newSocialUser;
//         res.render('account/signupsocial', { email: newSocialUser.email });
//       }
//     });

//   })(req, res, next);
// });

/**
 * Github Authentication
 */

// router.get('/auth/github/callback', function (req, res, next) {
//   Passport.authenticate('github', {
//     callbackURL: '/auth/github/callback',
//     failureRedirect: '/login'
//   }, function (err, user, info) {
//     if (!info || !info.profile) {
//       req.flash('error', { msg: 'We have no data. Something went wrong!' });
//       return res.redirect('/login');
//     }

//     // Do we already have a user with this GitHub ID?
//     // If so, then it's just a login - timestamp it.
//     User.findOne({ github: info.profile._json.id }, function (err, justLogin) {
//       if (err) {
//         return next(err);
//       }
//       if (justLogin) {
//         // Update the user's record with login timestamp
//         justLogin.activity.last_logon = Date.now();
//         justLogin.save(function (err) {
//           if (err) {
//             return next(err);
//           }
//           // Log the user in
//           req.login(justLogin, function (err) {
//             if (err) {
//               return next(err);
//             }

//             // Send user on their merry way
//             if (req.session.attemptedURL) {
//               var redirectURL = req.session.attemptedURL;
//               delete req.session.attemptedURL;
//               return res.redirect(redirectURL);
//             } else {
//               return res.redirect('/api');
//             }

//           });
//         });
//       } else {
//         // Brand new GitHub user!
//         // Save their profile data into the session
//         var newSocialUser               = {};

//         newSocialUser.source            = 'github';
//         newSocialUser.id                = info.profile._json.id;
//         newSocialUser.accessToken       = info.accessToken;
//         newSocialUser.refreshToken      = info.refreshToken;
//         newSocialUser.email             = info.profile._json.email;

//         newSocialUser.profile           = {};

//         newSocialUser.profile.name      = info.profile._json.name;
//         newSocialUser.profile.gender    = ''; // No gender from Github
//         newSocialUser.profile.location  = info.profile._json.location;
//         newSocialUser.profile.website   = info.profile._json.html_url;
//         newSocialUser.profile.picture   = info.profile._json.avatar_url;

//         req.session.socialProfile = newSocialUser;
//         res.render('account/signupsocial', { email: newSocialUser.email });
//       }
//     });

//   })(req, res, next);
// });

/**
 * Google Authentication
 */

router.get('/auth/google/callback', function (req, res, next) {
    console.log(req);
    console.log(res);

    return res.end(JSON.stringify(req.query, null, 2));
    if (!info || !info.profile) {
      req.flash('error', { msg: 'We have no data. Something went wrong!' });
      return res.redirect('/login');
    }

    // Do we already have a user with this Google ID?
    // If so, then it's just a login - timestamp it.
    User.findOne({ google: info.profile._json.id }, function (err, justLogin) {
      if (err) {
        return next(err);
      }
      if (justLogin) {
        // Update the user's record with login timestamp
        justLogin.activity.last_logon = Date.now();
        justLogin.save(function (err) {
          if (err) {
            return next(err);
          }
          // Log the user in
          req.login(justLogin, function (err) {
            if (err) {
              return next(err);
            }

            // Send user on their merry way
            if (req.session.attemptedURL) {
              var redirectURL = req.session.attemptedURL;
              delete req.session.attemptedURL;
              return res.redirect(redirectURL);
            } else {
              return res.redirect('/api');
            }

          });
        });
      } else {
        // Brand new Google user!
        // Save their profile data into the session
        var newSocialUser               = {};

        newSocialUser.source            = 'google';
        newSocialUser.id                = info.profile.id;
        newSocialUser.accessToken       = info.accessToken;
        newSocialUser.refreshToken      = info.refreshToken;
        newSocialUser.email             = info.profile._json.email;

        newSocialUser.profile           = {};

        newSocialUser.profile.name      = info.profile._json.name;
        newSocialUser.profile.gender    = info.profile._json.gender;
        newSocialUser.profile.location  = ''; // No location from Google
        newSocialUser.profile.website   = info.profile._json.link;
        newSocialUser.profile.picture   = info.profile._json.picture;

        req.session.socialProfile = newSocialUser;
        res.render('account/signupsocial', { email: newSocialUser.email });
      }
    });
});

// /**
//  * Twitter Authentication
//  */

// router.get('/auth/twitter',
//   Passport.authenticate('twitter', {
//     callbackURL: '/auth/twitter/callback'
//   })
// );

// router.get('/auth/twitter/callback', function (req, res, next) {
//   Passport.authenticate('twitter', {
//     callbackURL: '/auth/twitter/callback',
//     failureRedirect: '/login'
//   }, function (err, user, info) {
//     if (!info || !info.profile) {
//       req.flash('error', { msg: 'We have no data. Something went wrong!' });
//       return res.redirect('/login');
//     }

//     // Do we already have a user with this Twitter ID?
//     // If so, then it's just a login - timestamp it.
//     User.findOne({ twitter: info.profile._json.id }, function (err, justLogin) {
//       if (err) {
//         return next(err);
//       }
//       if (justLogin) {
//         // Update the user's record with login timestamp
//         justLogin.activity.last_logon = Date.now();
//         justLogin.save(function (err) {
//           if (err) {
//             return next(err);
//           }
//           // Log the user in
//           req.login(justLogin, function (err) {
//             if (err) {
//               return next(err);
//             }

//             // Send user on their merry way
//             if (req.session.attemptedURL) {
//               var redirectURL = req.session.attemptedURL;
//               delete req.session.attemptedURL;
//               return res.redirect(redirectURL);
//             } else {
//               return res.redirect('/api');
//             }

//           });
//         });
//       } else {
//         // Brand new Twitter user!
//         // Save their profile data into the session
//         var newSocialUser               = {};

//         newSocialUser.source            = 'twitter';
//         newSocialUser.id                = info.profile.id;
//         newSocialUser.token             = info.token;
//         newSocialUser.tokenSecret       = info.tokenSecret;
//         newSocialUser.email             = '';  // Twitter does not provide email addresses

//         newSocialUser.profile           = {};

//         newSocialUser.profile.name      = info.profile._json.name;
//         newSocialUser.profile.gender    = '';  // No gender from Twitter either
//         newSocialUser.profile.location  = info.profile._json.location || '';
//         // // Twitter may or may not provide a URL
//         if (typeof info.profile._json.entities.url !== 'undefined') {
//           newSocialUser.profile.website = info.profile._json.entities.url.urls[0].expanded_url;
//         } else {
//           newSocialUser.profile.website = '';
//         }
//         newSocialUser.profile.picture   = info.profile._json.profile_image_url;

//         req.session.socialProfile = newSocialUser;
//         res.render('account/signupsocial', { email: newSocialUser.email });
//       }
//     });

//   })(req, res, next);
// });

export default router;
