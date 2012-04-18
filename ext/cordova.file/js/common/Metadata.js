// file: lib/common/plugin/Metadata.js
cordova.define("cordova/plugin/Metadata", function(require, exports, module) {

/**
 * Information about the state of the file or directory
 * 
 * {Date} modificationTime (readonly)
 */
var Metadata = function(time) {
    this.modificationTime = (typeof time != 'undefined'?new Date(time):null);
};

module.exports = Metadata;

});

cordova.addPlugin('Metadata', 'cordova/plugin/Metadata', false);