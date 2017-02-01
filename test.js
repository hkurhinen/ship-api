var fs = require('fs');
var mongoose = require('mongoose');

//mongoose connect
mongoose.connect('mongodb://localhost/test');

//instantiate mongoose-gridfs
var gridfs = require('mongoose-gridfs')({
  collection:'attachments',
  model:'Attachment'
});
