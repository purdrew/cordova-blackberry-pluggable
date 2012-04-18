// file: lib/common/plugin/LocalFileSystem.js
cordova.define("cordova/plugin/LocalFileSystem", function(require, exports, module) {

var exec = require('cordova/exec');

/**
 * Represents a local file system.
 */
var LocalFileSystem = function() {

};

LocalFileSystem.TEMPORARY = 0; //temporary, with no guarantee of persistence
LocalFileSystem.PERSISTENT = 1; //persistent

module.exports = LocalFileSystem;

});

cordova.addPlugin('LocalFileSystem', 'cordova/plugin/LocalFileSystem', false);