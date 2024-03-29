// file: lib/common/plugin/Acceleration.js
cordova.define("cordova/plugin/Acceleration", function(require, exports, module) {
var Acceleration = function(x, y, z, timestamp) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.timestamp = timestamp || (new Date()).getTime();
};

module.exports = Acceleration;

});

cordova.addPlugin('Acceleration', 'cordova/plugin/Acceleration', false);