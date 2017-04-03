/*jshint esversion: 6 */
/* global __dirname */

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