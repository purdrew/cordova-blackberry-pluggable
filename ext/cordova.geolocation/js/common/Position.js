// file: lib/common/plugin/Position.js
cordova.define("cordova/plugin/Position", function(require, exports, module) {

var Coordinates = require('cordova/plugin/Coordinates');

var Position = function(coords, timestamp) {
	this.coords = new Coordinates(coords.latitude, coords.longitude, coords.altitude, coords.accuracy, coords.heading, coords.velocity, coords.altitudeAccuracy);
	this.timestamp = (timestamp !== undefined) ? timestamp : new Date().getTime();
};

module.exports = Position;

});

cordova.addPlugin('Position', 'cordova/plugin/Position', false);