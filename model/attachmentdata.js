/*jshint esversion: 6 */
(function () {
  'use strict';

  const gridfs = require('mongoose-gridfs')({
    collection: 'attachments',
    model: 'AttachmentData'
  });

  module.exports = gridfs.model;

})();