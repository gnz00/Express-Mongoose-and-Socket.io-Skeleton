import GoogleAuth from 'google-auth-library';
import Purest from 'purest';
import _ from 'lodash';

class GoogleProvider {

  _config = {};
  _apis = new Purest({ provider:'google' });

  constructor (config) {
    this._config = config;
    this._oAuth2Client = new (new GoogleAuth()).OAuth2(
      this._config.key,
      this._config.secret,
      this._config.callback
    );
  }

  async getCurrentProfile (accessToken) {
    if (!accessToken)
      return new Error('No access token provided!');

    return new Promise((resolve, reject) => {
      this._apis.query('plus')
      .get('people/me')
      .auth(accessToken)
      .request((err, res, body) => {
        if (err) reject(err);
        else
          resolve(res.body);
      });
    });
  }

  verifyIdToken (idToken) {
    console.log('verifyIdToken');
    // Call Google's oAuth2Client
    return new Promise((resolve, reject) => {
      this._oAuth2Client.verifyIdToken(
        idToken,
        this._config.key,
        (err, data) => {
          if (err) reject(err);
          else
            resolve(data.getPayload());
        }
      );
    });
  }

  serializeUser (profile) {
    console.log('serializeUser');
    return {
        source: 'google',
        id:             profile['id'],
        email:          profile['emails'][0]['value'],
        profile: {
          displayName:  profile['displayName'],
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
}

export default GoogleProvider;