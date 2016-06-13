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

app.get('/get/:id', function(req, res){
  var _id = req.params.id;
  Ship.findById(_id, function(err, ship){
    if(err){
      res.status(400).send(err);
    }else{
      res.send(ship);
    }
  });
});

app.get('/list', function(req, res){
  Ship.find({}, function(err, ships){
    if(err){
      res.status(400).send(err);
    }else{
      res.send(ships);
    }
  });
});

app.get('/search', function(req, res){
  var q = req.query.q;
  Ship.search({
    query_string: {
      query: q
    }
  }, function(err, results) {
    if(err){
      res.status(400).send(err);
    }else{
      res.send(results);
    }
  });
});

http.createServer(app).listen(app.get('port'), function() {
  console.log('Ship-api listening on port ' + app.get('port'));
});