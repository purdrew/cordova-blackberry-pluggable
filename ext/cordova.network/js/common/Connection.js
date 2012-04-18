// file: lib/common/plugin/Connection.js
cordova.define("cordova/plugin/Connection", function(require, exports, module) {
    
/**
 * Network status
 */
module.exports = {
		UNKNOWN: "unknown",
		ETHERNET: "ethernet",
		WIFI: "wifi",
		CELL_2G: "2g",
		CELL_3G: "3g",
		CELL_4G: "4g",
		NONE: "none"
};

});

cordova.addPlugin('Connection', 'cordova/plugin/Connection', false);