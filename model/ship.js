var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var schema = new Schema({
  buildnumber: {type: Number },
  name: { type: String },
  type_translated: {type: String},
  type: {type: String },
  type_info: {type: String},
  buildyear: { type: String},
  properties: [{
    property: {type: String},
    value: {type: String}
  }]
});

schema.plugin(mongoosastic)

module.exports = mongoose.model('Ship', schema);