var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config');
var XLSX = require('xlsx');
var util = require('util');
var fs = require('fs');

mongoose.connect('mongodb://' + config.database.host + '/' + config.database.table);

var Ship = require('./model/ship');

var app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});

app.set('port', config.port);
app.use(express.static(path.join(__dirname, 'public')));

function saveShip(ship) {
  ship.save(function(err, ship){
    if(err) {
      console.log(err);
    } else {
      console.log('Ship saved');
    }
  })
}

function getValues(row, cells, worksheet) {
  var values = [];
  for(var i = 0; i < cells.length;i++) {
    var cellAddress = XLSX.utils.encode_cell({ c: cells[i], r: row });
    if(worksheet[cellAddress]) {
      values.push(String(worksheet[cellAddress].v));
    }
  }
  return values;
}

function getValue(row, cell, worksheet, type) {
  var cellAddress = XLSX.utils.encode_cell({ c: cell, r: row });
  if(worksheet[cellAddress]) {
    var value = String(worksheet[cellAddress].v);
    value = value.replace(/(?:\r\n|\r|\n)/g, ' ');
    switch (type) {
      case 'String':
        return String(value);
      case 'Integer':
        value = String(value.split('-').slice(-1));
        value = value.replace(/[^0-9]/g, "");
        value = parseInt(value, 10);
        if(isNaN(value)) {
          return null;
        }
        return parseInt(value, 10);
      default:
        return value;
    }
  }

  return null;
}

app.get('/reindex', function (req, res) {
  var workbook = XLSX.readFile('/home/belvain/Documents/laiva_data/Laivadata_0/LAIVAKIRJA 2. kirja 1900 - 1920.xlsx');
  var worksheet = workbook.Sheets['LAIVAKIRJA 1900 - 1920']; //TODO: dynamically select
  var range = XLSX.utils.decode_range(worksheet['!ref']);
  var ships = [];
  var ship = null;
  for (var row = 5; row < range.e.r; row++) {
    var shipyard = XLSX.utils.encode_cell({ c: 1, r: row });
    if(worksheet[shipyard]) {
      if(ship) {
        //console.log(ship);
        saveShip(ship);
        //console.log(util.format('found new ship with name: %s, type: %s and buildnumber: %s', ship.name, ship.type, ship.buildnumber));
        //TODO: Save shipdata to database
      }
      ship = new Ship();
      ship.generalInformation = {
        name: getValue(row, 0, worksheet),
        shipyard: getValue(row, 1, worksheet),
        buildNumber: getValue(row, 2, worksheet)
      };
      ship.frame = {
        material: getValue(row, 3, worksheet), //TODO: translate
        length: getValue(row, 4, worksheet),
        beam: getValue(row, 6, worksheet),
        draft: getValue(row, 11, worksheet),
        mainArcArea: getValue(row, 64, worksheet),
        waterlineArea: getValue(row, 63, worksheet),
        weight: getValue(row, 30, worksheet),
      };
      ship.boiler = {
        type: getValue(row, 40, worksheet),
        heatingSurface: getValue(row, 41, worksheet),
        grateSurface: getValue(row, 42, worksheet),
        workPressure: getValue(row, 43, worksheet)
      };
      ship.engine = {
        type: getValue(row, 33, worksheet),
        stroke: getValue(row, 37, worksheet),
        cylinderFillRate: getValue(row, 76, worksheet),
        vacuum: getValue(row, 77, worksheet),
        RPM: getValue(row, 74, worksheet),
        indicatedPower: getValue(row, 32, worksheet)
      };
      ship.propeller = {
        diameter: getValue(row, 48, worksheet),
        pitch: getValue(row, 49, worksheet),
        bladeArea: getValue(row, 53, worksheet),
        bladeCount: getValue(row, 51, worksheet, 'Integer')
      };
      ship.seaTrial = {
        averageSpeed: getValue(row, 80, worksheet),
        knotsPerHour: getValue(row, 79, worksheet),
        verstsPerHour: getValue(row, 81, worksheet),
        date: getValue(row, 86, worksheet)
      };
      ship.additionalInformation = getValues(row, [71, 72, 87], worksheet);

    } else {
      if(!ship.generalInformation) {
        continue;
      }
      if(worksheet[XLSX.utils.encode_cell({ c: 0, r: row })]) {
        ship.generalInformation.type = getValue(row, 0, worksheet);
      }
      if(worksheet[XLSX.utils.encode_cell({ c: 2, r: row })]) {
        ship.generalInformation.buildYear = getValue(row, 2, worksheet, 'Integer');
      }
      var additionalInformations = getValues(row, [71, 72, 87], worksheet);
      ship.additionalInformation = ship.additionalInformation.concat(additionalInformations);
    }
  }
  res.send('ok');
});

app.get(config.basePath, function (req, res) {
  res.sendFile(path.join(__dirname, 'ship-api.json'));
});

app.get(config.basePath + '/ships', function (req, res) {
  Ship.find({}, function (err, ships) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(ships);
    }
  });
});

app.get(config.basePath + '/ships/:shipId', function (req, res) {
  var _id = req.params.shipId;
  Ship.findById(_id, function (err, ship) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(ship);
    }
  });
});

http.createServer(app).listen(app.get('port'), function () {
  console.log('Ship-api listening on port ' + app.get('port'));
});