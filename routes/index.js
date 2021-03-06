/*jshint esversion: 6 */
/* global __dirname */

(function () {
  'use strict';

  const path = require('path');
  const request = require('request');
  const { v4: uuidv4 } = require('uuid');
  const Ship = require(__dirname + '/../model/ship');
  const AttachmentMeta = require(__dirname + '/../model/attachmentmeta');
  const s3Utils = require(__dirname + '/../utils/s3Utils');

  exports.index = (req, res) => {
    res.sendFile(path.join(__dirname, '/../ship-api.json'));
  };

  exports.listShips = (req, res) => {
    var query = '*';
    var from = 0;
    var size = 10;
    if (req.query.q) {
      query = req.query['q'];
    }
    if (req.query['size']) {
      size = parseInt(req.query['size'], 10);
    }
    if (req.query['from']) {
      from = parseInt(req.query['from'], 10);
    }
    Ship.search({
      query_string: {
        query: query
      }
    }, {
        from: from,
        size: size,
        sort: [
          { buildnumber: { order: 'asc', missing: '_last' } }
        ]
      }, (err, results) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(results);
        }
      });
  };

  exports.findShip = (req, res) => {
    var id = req.params.id;
    Ship.findById(id, (err, ship) => {
      if (err) {
        res.status(500).send(err);
      } else {
        if (!ship) {
          res.status(404).send();
        } else {
          res.send(ship);
        }
      }
    });
  };


  exports.listAttachments = (req, res) => {
    var query = {};
    if (req.query.buildnumber) {
      query['buildnumber'] = req.query.buildnumber;
    }
    AttachmentMeta.find(query, (err, attachmentMetas) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(attachmentMetas);
      }
    });
  };

  exports.findAttachment = (req, res) => {
    var id = req.params.id;
    AttachmentMeta.findById(id, (err, attachmentMeta) => {
      if (err) {
        res.status(500).send(err);
      } else {
        if (!attachmentMeta) {
          res.status(404).send();
        } else {
          res.send(attachmentMeta);
        }
      }
    });
  };

  exports.getAttachmentData = (req, res) => {
    var id = req.params.id;
    AttachmentMeta.findById(id, (err, attachmentMeta) => {
      if (err) {
        res.status(500).send(err);
      } else {
        if (!attachmentMeta) {
          res.status(404).send();
        } else {
          if (attachmentMeta.type === 'INTERNAL') {
            res.status(501).send("Internal attachments are no longer supported");
          } else {
            request
              .get(attachmentMeta.url)
              .on('response', function (response) {
                response.headers['content-type'] = attachmentMeta.contenttype;
              }).pipe(res);
          }
        }
      }
    });
  };

  exports.uploadShip = (req, res) => {
    var ship = req.body.ship;
    var newShip = new Ship(ship);
    newShip.save((err, savedShip) => {
      if (err) {
        res.status(500).send();
      } else {
        res.send(savedShip);
      }
    });
  };

  exports.uploadAttachment = async (req, res) => {
    var attachmentMeta = new AttachmentMeta();
    attachmentMeta.filename = req.file.originalname;
    attachmentMeta.contenttype = req.file.mimetype;
    attachmentMeta.type = 'EXTERNAL';
    attachmentMeta.buildnumber = parseInt(req.body.buildnumber, 10);
    attachmentMeta.url = await s3Utils.uploadAttachment(req.file.buffer, uuidv4());
    attachmentMeta.save((err, attachmentMeta) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(attachmentMeta);
      }
    });
  };

})();