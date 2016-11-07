var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config');
var XLSX = require('xlsx');
var util = require('util');
var fs = require('fs');
var exec = require('child_process').exec;

var downloading = false;
var downloadQueue = [];

mongoose.connect('mongodb://' + config.database.host + '/' + config.database.table);

var Ship = require('./model/ship');

var app = express();

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});

app.set('port', config.port);
app.use(express.static(path.join(__dirname, 'public')));

function saveShip(ship) {
  ship.save(function (err, ship) {
    if (err) {
      console.log(err);
    } else {
      console.log('Ship saved');
    }
  })
}

function getValues(row, cells, worksheet) {
  var values = [];
  for (var i = 0; i < cells.length; i++) {
    var cellAddress = XLSX.utils.encode_cell({ c: cells[i], r: row });
    if (worksheet[cellAddress]) {
      values.push(String(worksheet[cellAddress].v));
    }
  }
  return values;
}

function getValue(row, cell, worksheet, type) {
  var cellAddress = XLSX.utils.encode_cell({ c: cell, r: row });
  if (worksheet[cellAddress]) {
    var value = String(worksheet[cellAddress].v);
    value = value.replace(/(?:\r\n|\r|\n)/g, ' ');
    switch (type) {
      case 'String':
        return String(value);
      case 'Integer':
        value = String(value.split('-').slice(-1));
        value = value.replace(/[^0-9]/g, "");
        value = parseInt(value, 10);
        if (isNaN(value)) {
          return null;
        }
        return parseInt(value, 10);
      default:
        return value;
    }
  }

  return null;
}

function processQueue() {
  if (downloadQueue.length < 1) {
    downloading = false;
  } else {
    var attachmentPath = '/home/belvain/Documents/laiva_data/laivadata_elka/00033-jpg/';
    var targetPath = __dirname + '/public/resized/';
    var attachment = downloadQueue[0];
    exec('convert -resize 1920x '+attachmentPath+attachment+' '+targetPath+attachment, function(error, stdout, stderr) {
      if (error) {
        console.log(error);
      }
      if (downloading) {
        downloadQueue.shift();
        console.log(downloadQueue.length + ' files left');
        processQueue();
      }
    });
  }
}

function downloadAttachment(attachment) {
  if(downloadQueue.indexOf(attachment.fileName) == -1){
    downloadQueue.push(attachment.fileName);
  }
  if (!downloading) {
    downloading = true;
    processQueue();
  }
}

function updateAttachments(buildNumber, attachments) {

  Ship.find({ 'generalInformation.buildNumber': buildNumber }, function (err, ships) {
    if (ships.length > 0) {
      for (var j = 0; j < attachments.length; j++) {
        var attachment = attachments[j];
        downloadAttachment(attachment);
      }
    }
    for (var i = 0; i < ships.length; i++) {
      var ship = ships[i];
      ship.attachments = ship.attachments.concat(attachments);
      console.log(ship.attachments);
      ship.save(function (err, ship) {
        console.log(util.format('ship %s saved', ship._id));
      });
    }
  });
}

app.get('/updateAttachments', function (req, res) {
  var path = '/home/belvain/Documents/laiva_data/Laivapiirustukset_valmiit/'
  fs.readdir(path, function (err, files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.startsWith('_')) {
        continue;
      }
      var nameParts = file.split('_');
      var buildNumber = nameParts[0];
      updateShip(buildNumber);
    }
  });
  res.send('ok');
});

app.get('/updateAttachmentsFromExcel', function (req, res) {
  var path = __dirname + '/attachmentLists/';
  var attachmentPath = '/home/belvain/Documents/laiva_data/laivadata_elka/00033-jpg/';
  console.log(path);
  fs.readdir(path, function (err, files) {
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var workbook = XLSX.readFile(path + file);
        var sheetName = Object.keys(workbook.Sheets)[0];
        var worksheet = workbook.Sheets[sheetName];
        var range = XLSX.utils.decode_range(worksheet['!ref']);
        for (var row = 1; row < range.e.r; row++) {
          var col = 4;
          var attachments = [];
          var buildnumber = worksheet[XLSX.utils.encode_cell({ c: 0, r: row })].v;
          while (worksheet[XLSX.utils.encode_cell({ c: col, r: row })]) {
            var attachment = {
              displayName: worksheet[XLSX.utils.encode_cell({ c: col, r: row })].v,
              fileName: worksheet[XLSX.utils.encode_cell({ c: col + 1, r: row })].v + '.jpg'
            }
            try {
              fs.accessSync(attachmentPath + attachment.fileName, fs.F_OK);
              attachments.push(attachment);
            } catch (e) {
              console.log('Could not find attachment ' + attachment.fileName);
            }
            col += 2;
          }
          updateAttachments(buildnumber, attachments);
        }
      }
    }
  });
  res.send('ok');
});

app.get('/reindex', function (req, res) {
  var workbook = XLSX.readFile(__dirname+'/importdata/data.xlsx');
  var worksheet = workbook.Sheets[Object.keys(workbook.Sheets)[0]]; //TODO: dynamically select
  var range = XLSX.utils.decode_range(worksheet['!ref']);
  var ships = [];
  var ship = null;
  for (var row = 5; row < range.e.r; row++) {
    var shipyard = XLSX.utils.encode_cell({ c: 1, r: row });
    if (worksheet[shipyard]) {
      if (ship) {
        saveShip(ship);
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
      if (!ship.generalInformation) {
        continue;
      }
      if (worksheet[XLSX.utils.encode_cell({ c: 0, r: row })]) {
        ship.generalInformation.type = getValue(row, 0, worksheet);
      }
      if (worksheet[XLSX.utils.encode_cell({ c: 2, r: row })]) {
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
  var query = '*';
  if (req.query.q) {
    query = req.query.q;
  }
  Ship.search({
    query_string: {
      query: query
    }
  }, function (err, results) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(results);
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