// file: lib/common/plugin/FileTransferError.js
cordova.define("cordova/plugin/FileTransferError", function(require, exports, module) {

/**
 * FileTransferError
 * @constructor
 */
var FileTransferError = function(code) {
    this.code = code || null;
};

FileTransferError.FILE_NOT_FOUND_ERR = 1;
FileTransferError.INVALID_URL_ERR = 2;
FileTransferError.CONNECTION_ERR = 3;

module.exports = FileTransferError;

});

cordova.addPlugin('FileTransferError', 'cordova/plugin/FileTransferError', false);