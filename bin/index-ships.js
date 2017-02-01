/*jshint esversion: 6 */
(function () {
  'use strict';

  const commandLineArgs = require('command-line-args');
  const async = require('async');
  const ProgressBar = require('progress');
  const request = require('request');

  const Ship = require(__dirname + '/../model/ship');

  const optionDefinitions = [
    { name: 'input', alias: 'i', type: String },
    { name: 'url', alias: 'u', type: String }
  ];

  const options = commandLineArgs(optionDefinitions);

  const datas = require(options.input);

  var bar = new ProgressBar('uploading [:bar] :percent :etas', { total: datas.length });

  async.eachSeries(datas, (data, callback) => {
    var ship = {
      buildnumber: data.buildnumber && data.buildnumber !== '-' ? parseInt(data.buildnumber, 10) : null,
      name: data.name,
      type_translated: data.type_translated,
      type: data.type,
      buildyear: data.buildyear,
      properties: []
    };
    var properties = Object.keys(data);
    var commonProperties = Object.keys(ship);
    for (let i = 0; i < properties.length; i++) {
      var property = properties[i];
      if (commonProperties.indexOf(property) > -1) {
        continue;
      }
      if (data[property] && data[property] != '') {
        ship.properties.push({
          property: property,
          value: data[property]
        });
      }
    }
    var query = {};
    if (ship.buidnumber) {
      query['buildnumber'] = ship.buildnumber;
    } else {
      query['name'] = ship.name;
    }

    request({
      uri: options.url,
      method: 'POST',
      json: { 'ship': ship }
    }, function (err, response, body) {
      bar.tick();
      callback(err);
    });

  }, (err) => {
    if (err) {
      console.error('Error inserting ships', err);
      process.exit(1)
    } else {
      console.log('Ships successfully indexed.');
      process.exit();
    }
  });

})();