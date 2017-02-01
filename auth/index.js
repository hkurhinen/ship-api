/*jshint esversion: 6 */
(function () {
  'use strict';

  const config = require(__dirname + '/../config.js');

  function findUserByAPIKey(apikey) {
    for (let i = 0; i < config.admins.length; i++) {
      if (config.admins[i].apikey === apikey) {
        return config.admins[i];
      }
    }

    return null;
  };

  module.exports = (passport) => {
    passport.use(new LocalAPIKeyStrategy((apikey, done) => {
      var user = findUserByAPIKey(apikey);
      if (!user) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }));
  };

})();