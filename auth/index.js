/*jshint esversion: 6 */
/* global __dirname */

(function () {
  'use strict';

  const config = require('nconf');

  function findUserByAPIKey(apikey) {
    var admins = config.get('admins');
    for (let i = 0; i < admins.length; i++) {
      if (admins[i].apikey === apikey) {
        return admins[i];
      }
    }

    return null;
  };

  module.exports = (req, res, next) => {
    var apikey = req.header('apikey');
    if (!apikey) {
      res.status(401).send('Go away!');
    } else {
      var user = findUserByAPIKey(apikey);
      if (!user) {
        res.status(401).send('Go away!');
      } else {
        next();
      } 
    }
  };

})();