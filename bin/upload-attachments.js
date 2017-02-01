/*jshint esversion: 6 */
(function () {
  'use strict';

  const commandLineArgs = require('command-line-args');
  const async = require('async');
  const ProgressBar = require('progress');
  const request = require('request');
  const XLSX = require('xlsx');
  const util = require('util');
  const fs = require('fs');

  const optionDefinitions = [
    { name: 'names', alias: 'n', type: Boolean },
    { name: 'sheet', alias: 's', type: String },
    { name: 'path', alias: 'p', type: String },
    { name: 'url', alias: 'u', type: String },
    { name: 'extension', alias: 'e', type: String }
  ];

  const options = commandLineArgs(optionDefinitions);

  function fileExists(file) {
    try {
      fs.accessSync(file, fs.F_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  function uploadAttachments(attachments) {
    var bar = new ProgressBar('uploading files [:bar] :current / :total', { total: attachments.length });
    async.eachSeries(attachments, (attachment, callback) => {
      var formData = {
        buildnumber: attachment.buildnumber,
        file: {
          value: fs.createReadStream(attachment.filename),
          options: {
            filename: attachment.originalname,
          }
        }
      };
      request.post({ url: options.url, formData: formData }, (err, httpResponse, body) => {
        bar.tick();
        callback(err);
      });
    }, (err) => {
      if(err) {
        console.log('File upload failed', err);
        process.exit(1);
      } else {
        console.log('Files uploaded');
        process.exit();
      }
    });
  }

  if (options.names) {
    //TODO: implement reading files
  } else {
    var workbook = XLSX.readFile(options.sheet);
    var sheetName = Object.keys(workbook.Sheets)[0];
    var worksheet = workbook.Sheets[sheetName];
    var range = XLSX.utils.decode_range(worksheet['!ref']);
    var attachments = [];
    for (var row = 1; row < range.e.r; row++) {
      var col = 4;
      var buildnumber = worksheet[XLSX.utils.encode_cell({ c: 0, r: row })].v;
      if (worksheet[XLSX.utils.encode_cell({ c: 3, r: row })]) {
        var filepath = util.format('%s%s', options.path, worksheet[XLSX.utils.encode_cell({ c: 3, r: row })].v + '.' + options.extension);
        if (fileExists(filepath)) {
          attachments.push({
            buildnumber: buildnumber,
            originalname: 'Alusrakentamisen työkirja',
            filename: filepath
          });
        }
      }
      while (worksheet[XLSX.utils.encode_cell({ c: col, r: row })]) {
        var attachment = util.format('%s%s', options.path, worksheet[XLSX.utils.encode_cell({ c: col + 1, r: row })].v + '.' + options.extension);
        if (fileExists(attachment)) {
          attachments.push({
            buildnumber: buildnumber,
            originalname: worksheet[XLSX.utils.encode_cell({ c: col, r: row })].v,
            filename: attachment
          });
        }
        col += 2;
      }
    }
    uploadAttachments(attachments);
  }

})();