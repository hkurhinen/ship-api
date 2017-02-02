/*jshint esversion: 6 */
(function () {
  'use strict';

  const express = require('express');
  const http = require('http');
  const path = require('path');
  const mongoose = require('mongoose');
  const config = require('./config');
  const util = require('util');
  const passport = require('passport');
  const bodyParser = require('body-parser')
  const Promise = require('bluebird');
  const multer = require('multer');
  const AttachmentScheduler = require('./schedulers');

  process.on('unhandledRejection', function (error, promise) {
    console.error('UNHANDLED REJECTION', error.stack);
  });

  mongoose.Promise = Promise;
  mongoose.connect(util.format('mongodb://%s/%s', config.database.host, config.database.table));

  const gridFSStorage = require(__dirname + '/storage/gridFSStorage.js');
  const fileParser = multer({ storage: gridFSStorage() });

  function extendTimeout(timeout) {
    return (req, res, next) => {
      res.setTimeout(timeout, () => {
        console.log('Request has timed out.');
        res.send(408);
      });
      next();
    };
  };

  var attachmentScheduler = new AttachmentScheduler('25 0 * * *');

  var app = express();

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.set('port', config.port);
  app.use(express.static(path.join(__dirname, 'public')));

  const routes = require(__dirname + '/routes');

  app.get(config.basePath, routes.index);

  app.get(util.format('%s/ships', config.basePath), routes.listShips);
  app.get(util.format('%s/ships/:id', config.basePath), routes.findShip);

  app.get(util.format('%s/attachments', config.basePath), routes.listAttachments);
  app.get(util.format('%s/attachments/:id', config.basePath), routes.findAttachment);
  app.get(util.format('%s/attachments/:id/data', config.basePath), routes.getAttachmentData);

  app.post('/upload/ship', routes.uploadShip);
  app.post('/upload/attachment', extendTimeout(1000 * 60 * 60), fileParser.single('file'), routes.uploadAttachment);

  http.createServer(app).listen(app.get('port'), function () {
    console.log('Ship-api listening on port ' + app.get('port'));
  });

})();