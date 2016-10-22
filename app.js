var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config');

mongoose.connect('mongodb://' + config.database.host + '/' + config.database.table);

var Ship = require('./model/ship');

var app = express();

app.set('port', config.port);
app.use(express.static(path.join(__dirname, 'public')));

app.get(config.basePath, function(req, res) {
  res.sendFile(path.join(__dirname, 'ship-api.json'));
});

app.get(config.basePath+'/ships', function(req, res){
  Ship.find({}, function(err, ships){
    if(err){
      res.status(400).send(err);
    }else{
      res.send(ships);
    }
  });
});

app.get(config.basePath+'/ships/:shipId', function(req, res){
  var _id = req.params.shipId;
  Ship.findById(_id, function(err, ship){
    if(err){
      res.status(400).send(err);
    }else{
      res.send(ship);
    }
  });
});

app.get(config.basePath+'/attachments', function(req, res){
  res.status(501).send('NOT IMPLEMENTED');
});

app.get(config.basePath+'/attachments/:attachmentId', function(req, res){
  res.status(501).send('NOT IMPLEMENTED');
});

app.get(config.basePath+'/attachments/:attachmentId/data', function(req, res){
  res.status(501).send('NOT IMPLEMENTED');
});

http.createServer(app).listen(app.get('port'), function() {
  console.log('Ship-api listening on port ' + app.get('port'));
});