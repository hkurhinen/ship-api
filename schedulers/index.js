/*jshint esversion: 6 */
(function () {
  'use strict';

  const config = require(__dirname + '/../config');
  const async = require('async');
  const request = require('request');
  const util = require('util');
  const http = require('http');
  const fileType = require('file-type');
  const schedule = require('node-schedule');
  const AttachmentMeta = require(__dirname + '/../model/attachmentmeta');

  class AttachmentScheduler {
    constructor(interval) {
      this.interval = interval;
      this.queue = async.queue(this.processQueue, 1);
      this.scheduler = schedule.scheduleJob(interval, () => {
        this.discoverAttachments();
      });
      this.queue.drain = () => {
        console.log('Finished processing attachments');
      };
    }

    discoverAttachments() {
      console.log('Starting attachment discovery');
      http.get('http://piipunjuurella.fi/rest/ships', (res) => {
        var body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          var attachments = JSON.parse(body);
          for (let i = 0; i < attachments.length; i++) {
            this.queue.push(attachments[i]);
          }
        });
      }).on('error', (err) => {
        console.error('Error listing attachments', err);
      });
    }

    processQueue(attachment, discoverCallback) {
      var buildnumbers = attachment.confidential.split('_');
      buildnumbers.shift();
      async.each(buildnumbers, (buildnumberString, buildnumberCallback) => {
        var buildnumber = parseInt(buildnumberString, 10);
        if (!buildnumber) {
          console.log(attachment);
        }
        var originalId = attachment.id;
        AttachmentMeta.count({
          originalid: originalId,
          buildnumber: buildnumber
        }, (countErr, count) => {
          if (countErr) {
            buildnumberCallback(countErr);
          } else {
            if (count > 0) {
              buildnumberCallback();
            } else {
              var resolution = '';
              if (attachment.hres_filename) {
                resolution = 'hres';
              } else if (attachment.mres_filename) {
                resolution = 'mres';
              } else if (attachment.lres_filename) {
                resolution = 'lres';
              } else {
                resolution = 'original';
              }
              var attachmentUrl = util.format('http://piipunjuurella.fi/rest/shipImages/%s/%s', originalId, resolution);
              http.get(attachmentUrl, res => {
                res.once('data', chunk => {
                  res.destroy();
                  var filedata = fileType(chunk);
                  var attachmentMeta = new AttachmentMeta();
                  attachmentMeta.filename = attachment.presentation;
                  attachmentMeta.contenttype = filedata.mime;
                  attachmentMeta.type = 'EXTERNAL';
                  attachmentMeta.buildnumber = buildnumber;
                  attachmentMeta.url = attachmentUrl;
                  attachmentMeta.originalid = originalId;
                  attachmentMeta.save((saveErr, attachmentMeta) => {
                    buildnumberCallback(saveErr);
                  });
                });
              }).on('error', (loadErr) => {
                buildnumberCallback(loadErr);
              });
            }
          }
        });
      }, (err) => {
        if (err) {
          console.error('Error loading attachment', err);
        }
        discoverCallback();
      });
    }
  }

  module.exports = AttachmentScheduler;

})();