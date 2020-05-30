/*jshint esversion: 6 */
/* global __dirname */

(function () {
  'use strict';

  const AWS = require('aws-sdk');
  const FileType = require('file-type');
  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  const bucket = process.env.AWS_S3_BUCKET;
  const cloudfront = process.env.AWS_CLOUDFRONT;
  AWS.config.update({
    region: process.env.AWS_IAM_REGION || ""
  });

  exports.uploadFile = (buffer, name, folder) => {
    return new Promise((resolve, reject) => {
      if (!AWS.config.credentials) {
        reject("AWS: Undefined credentials");
      }

      FileType.fromBuffer(buffer)
        .then((filedata) => {
          const key = `${folder}/${name}.${filedata.ext}`;
          const s3PutObjectParams = {
            Body: buffer,
            Bucket: bucket,
            Key: key,
            ContentType: filedata.mime
          };
      
          s3.upload(s3PutObjectParams)
            .promise()
            .then((data) => {
              resolve(`${cloudfront}/${data.Key}`);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

})();