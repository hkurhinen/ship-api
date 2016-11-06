var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var schema = new Schema({
  generalInformation: {
    buildNumber: { type: String },
    buildYear: { type: Number },
    name: { type: String },
    type: { type: String },
    drawingNumber: { type: Number },
    shipyard: { type: String }
  },
  frame: {
    orderNumber: { type: Number },
    drawingNumber: { type: Number },
    length: { type: String },
    beam: { type: String },
    draft: { type: String },
    mainArcArea: { type: String },
    waterlineArea: { type: String },
    plannedDraft: { type: String },
    modeledDraft: { type: String },
    material: { type: String },
    weight: { type: String }
  },
  boiler: {
    orderNumber: { type: Number },
    drawingNumber: { type: Number },
    type: { type: String },
    size: { type: String },
    heatingSurface: { type: String },
    grateSurface: { type: String },
    workPressure: { type: String },
    weight: { type: String }
  },
  engine: {
    orderNumber: { type: Number },
    drawingNumber: { type: Number },
    type: { type: String },
    size: { type: String },
    cylinderDiameter: { type: String },
    stroke: { type: String },
    cylinderFillRate: { type: String },
    vacuum: { type: String },
    steamPressure: { type: String },
    RPM: { type: String },
    indicatedPower: { type: String }
  },
  propeller: {
    diameter: { type: String },
    pitch: { type: String },
    bladeArea: { type: String },
    bladeCount: { type: Number }
  },
  seaTrial: {
    averageSpeed: { type: String },
    knotsPerHour: { type: String },
    verstsPerHour: { type: String },
    data: { type: String }
  },
  additionalInformation: [{ type: String }],
  attachments:[{
    displayName: { type: String },
    fileName: { type: String }
  }]
});

schema.plugin(mongoosastic)

module.exports = mongoose.model('Ship', schema);