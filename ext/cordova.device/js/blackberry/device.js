// file: lib/common/plugin/blackberry/device.js
cordova.define("cordova/plugin/blackberry/device", function(require, exports, module) {

var me = {},
    channel = require('cordova/channel'),
    exec = require('cordova/exec');

channel.onCordovaReady.subscribeOnce(function() {
    exec(function (device) {
        me.platform = device.platform;
        me.version  = device.version;
        me.name     = device.name;
        me.uuid     = device.uuid;
        me.cordova  = device.cordova;

        channel.onCordovaInfoReady.fire();
    },function (e) {
        console.log("error initializing cordova: " + e);
    },
        "Device",
        "getDeviceInfo",
        []
    );
});

module.exports = me;

});

cordova.addPlugin('device', 'cordova/plugin/blackberry/device', true);
cordova.mergePlugin('navigator.device', 'cordova/plugin/blackberry/device');