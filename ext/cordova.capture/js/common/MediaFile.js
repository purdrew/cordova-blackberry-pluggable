// file: lib/common/plugin/MediaFile.js
cordova.define("cordova/plugin/MediaFile", function(require, exports, module) {

var utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    File = require('cordova/plugin/File'),
    CaptureError = require('cordova/plugin/CaptureError');
/**
 * Represents a single file.
 *
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */
var MediaFile = function(name, fullPath, type, lastModifiedDate, size){
  MediaFile.__super__.constructor.apply(this, arguments);
};

utils.extend(MediaFile, File);

/**
 * Request capture format data for a specific file and type
 * 
 * @param {Function} successCB
 * @param {Function} errorCB
 */
MediaFile.prototype.getFormatData = function(successCallback, errorCallback) {
	if (typeof this.fullPath === "undefined" || this.fullPath === null) {
		errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
	} else {
    exec(successCallback, errorCallback, "Capture", "getFormatData", [this.fullPath, this.type]);
	}	
};

/**
 * Casts a PluginResult message property  (array of objects) to an array of MediaFile objects
 * (used in Objective-C and Android)
 *
 * @param {PluginResult} pluginResult
 */
MediaFile.cast = function(pluginResult) {
  var mediaFiles = [];
  var i;
  for (i=0; i<pluginResult.message.length; i++) {
    var mediaFile = new MediaFile();
    mediaFile.name = pluginResult.message[i].name;
    mediaFile.fullPath = pluginResult.message[i].fullPath;
    mediaFile.type = pluginResult.message[i].type;
    mediaFile.lastModifiedDate = pluginResult.message[i].lastModifiedDate;
    mediaFile.size = pluginResult.message[i].size;
    mediaFiles.push(mediaFile);
  }
  pluginResult.message = mediaFiles;
  return pluginResult;
};

module.exports = MediaFile;

});

cordova.addPlugin('MediaFile', 'cordova/plugin/MediaFile', false);