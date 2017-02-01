/*jshint esversion: 6 */
(function () {
  'use strict';

  const AttachmentData = require(__dirname + '/../model/attachmentdata');

  function GridFSStorage(opts) { }

  GridFSStorage.prototype._handleFile = (req, file, cb) => {
    AttachmentData.write({ filename: file.originalname, contentType: file.mimetype }, file.stream, (error, createdFile) => {
      if (error) {
        cb(err);
      } else {
        cb(null, {
          id: createdFile._id,
          buildnumber: req.body.buildnumber
        });
      }
    });
  }

  GridFSStorage.prototype._removeFile = (req, file, cb) => {
    AttachmentData.unlinkById(file.id, (error, removedFile) => {
      cb(error);
    });
  }

  module.exports = function (opts) {
    return new GridFSStorage(opts)
  }

})();