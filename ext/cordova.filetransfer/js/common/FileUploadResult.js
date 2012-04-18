// file: lib/common/plugin/FileUploadResult.js
cordova.define("cordova/plugin/FileUploadResult", function(require, exports, module) {

/**
 * FileUploadResult
 * @constructor
 */
var FileUploadResult = function() {
    this.bytesSent = 0;
    this.responseCode = null;
    this.response = null;
};

module.exports = FileUploadResult;

});

cordova.addPlugin('FileUploadResult', 'cordova/plugin/FileUploadResult', false);