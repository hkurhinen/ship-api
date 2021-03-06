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
  
  const mongoose = require('mongoose');
  const util = require('util');
  const bodyParser = require('body-parser');
  const Promise = require('bluebird');
  const multer = require('multer');
  const AttachmentScheduler = require('./schedulers');
  const basePath = process.env.API_BASE_PATH || "/v1";

  process.on('unhandledRejection', function (error, promise) {
    console.error('UNHANDLED REJECTION', error.stack);
  });

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'shipApi',
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  };

  mongoose.Promise = Promise;
  const dbUrl = `mongodb://${dbConfig.user}:${dbConfig.pass}@${dbConfig.host}/${dbConfig.database}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`;
  mongoose.connect(dbUrl);

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

  http.createServer(app).listen(app.get('port'), function () {
    console.log('Ship-api listening on port ' + app.get('port'));
  });

})();