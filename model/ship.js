/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  const mongoose = require('mongoose');
  const mongoosastic = require('mongoosastic');
  const Schema = mongoose.Schema;
  const config = require('nconf');

  var schema = new Schema({
    buildnumber: { type: Number },
    name: { type: String },
    type_translated: { type: String },
    type: { type: String },
    type_info: { type: String },
    buildyear: { type: String },
    properties: [{
      property: { type: String },
      value: { type: String }
    }]
  });

  schema.plugin(mongoosastic, {
    hosts: config.get('elasticsearch:hosts')
  });
  
 module.exports = mongoose.model('Ship', schema);

})();