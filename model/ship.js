var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: String,
  details: {
    year: Number,
    length: Number,
    description: String
  },
  attachments: [String]
});

schema.plugin(mongoosastic)

module.exports = mongoose.model('Ship', schema);