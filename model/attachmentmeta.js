/*jshint esversion: 6 */
(function () {
  'use strict';

  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  var schema = new Schema({
    buildnumber: { type: Number },
    type: { type: String },
    url: { type: String },
    filename: { type: String },
    contenttype: { type: String },
    originalid: { type: String },
    attachmentdata: { type: mongoose.Schema.Types.ObjectId }
  });

  module.exports = mongoose.model('Attachment', schema);
})();