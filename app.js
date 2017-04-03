/*jshint esversion: 6 */
/* global __dirname */

(function () {
  'use strict';

  const express = require('express');
  const http = require('http');
  const path = require('path');
  const commandLineArgs = require('command-line-args');
  
  const optionDefinitions = [
    { name: 'config', alias: 'c', type: String },
    { name: 'port', alias: 'p', type: Number }
  ];
  const options = commandLineArgs(optionDefinitions);
  
  const config = require('nconf');
  config.file({ file: options.config || 'config.json' });
  
  const mongoose = require('mongoose');
  const util = require('util');
  const bodyParser = require('body-parser');
  const Promise = require('bluebird');
  const multer = require('multer');
  const AttachmentScheduler = require('./schedulers');
  const auth = require(__dirname + '/auth');
  const basePath = config.get('basePath');

  process.on('unhandledRejection', function (error, promise) {
    console.error('UNHANDLED REJECTION', error.stack);
  });

  mongoose.Promise = Promise;
  mongoose.connect(util.format('mongodb://%s/%s', config.get('database:host'), config.get('database:table')));

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

  var attachmentScheduler = new AttachmentScheduler('30 0 * * *');

  var app = express();

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.set('port', options.port || 3000);
  app.use(express.static(path.join(__dirname, 'public')));

  const routes = require(__dirname + '/routes');

  app.get(basePath, routes.index);

  app.get(util.format('%s/ships', basePath), routes.listShips);
  app.get(util.format('%s/ships/:id', basePath), routes.findShip);

  app.get(util.format('%s/attachments', basePath), routes.listAttachments);
  app.get(util.format('%s/attachments/:id', basePath), routes.findAttachment);
  app.get(util.format('%s/attachments/:id/data', basePath), routes.getAttachmentData);

  app.post('/upload/ship', auth, routes.uploadShip);    
  app.post('/upload/attachment', auth, extendTimeout(1000 * 60 * 60), fileParser.single('file'), routes.uploadAttachment);

  http.createServer(app).listen(app.get('port'), function () {
    console.log('Ship-api listening on port ' + app.get('port'));
  });

})();