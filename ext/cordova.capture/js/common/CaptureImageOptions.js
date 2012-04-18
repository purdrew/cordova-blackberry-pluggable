// file: lib/common/plugin/CaptureImageOptions.js
cordova.define("cordova/plugin/CaptureImageOptions", function(require, exports, module) {

/**
 * Encapsulates all image capture operation configuration options.
 */
var CaptureImageOptions = function(){
	// Upper limit of images user can take. Value must be equal or greater than 1.
	this.limit = 1;
	// The selected image mode. Must match with one of the elements in supportedImageModes array.
	this.mode = null;
};

module.exports = CaptureImageOptions;

});

cordova.addPlugin('CaptureImageOptions', 'cordova/plugin/CaptureImageOptions', false);