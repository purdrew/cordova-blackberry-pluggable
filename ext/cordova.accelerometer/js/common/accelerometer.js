// file: lib/common/plugin/accelerometer.js
cordova.define("cordova/plugin/accelerometer", function(require, exports, module) {
    
/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
var utils = require("cordova/utils"),
    exec = require("cordova/exec");

// Local singleton variables.
var timers = {};

var accelerometer = {
    /**
     * Asynchronously aquires the current acceleration.
     *
     * @param {Function} successCallback    The function to call when the acceleration data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
     * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     */
    getCurrentAcceleration: function(successCallback, errorCallback, options) {

        // successCallback required
        if (typeof successCallback !== "function") {
            console.log("Accelerometer Error: successCallback is not a function");
            return;
        }

        // errorCallback optional
        if (errorCallback && (typeof errorCallback !== "function")) {
            console.log("Accelerometer Error: errorCallback is not a function");
            return;
        }

        // Get acceleration
        exec(successCallback, errorCallback, "Accelerometer", "getAcceleration", []);
    },

    /**
     * Asynchronously aquires the acceleration repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the acceleration data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
     * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchAcceleration: function(successCallback, errorCallback, options) {

        // Default interval (10 sec)
        var frequency = (options !== undefined && options.frequency !== undefined)? options.frequency : 10000;

        // successCallback required
        if (typeof successCallback !== "function") {
            console.log("Accelerometer Error: successCallback is not a function");
            return;
        }

        // errorCallback optional
        if (errorCallback && (typeof errorCallback !== "function")) {
            console.log("Accelerometer Error: errorCallback is not a function");
            return;
        }

        // Make sure accelerometer timeout > frequency + 10 sec
        exec(
            function(timeout) {
                if (timeout < (frequency + 10000)) {
                    exec(null, null, "Accelerometer", "setTimeout", [frequency + 10000]);
                }
            },
            function(e) { }, "Accelerometer", "getTimeout", []);

        // Start watch timer
        var id = utils.createUUID();
        timers[id] = window.setInterval(function() {
            exec(successCallback, errorCallback, "Accelerometer", "getAcceleration", []);
        }, (frequency ? frequency : 1));

        return id;
    },

    /**
     * Clears the specified accelerometer watch.
     *
     * @param {String} id       The id of the watch returned from #watchAcceleration.
     */
    clearWatch: function(id) {

        // Stop javascript timer & remove from timer list
        if (id && timers[id] !== undefined) {
            window.clearInterval(timers[id]);
            delete timers[id];
        }
    }
};

module.exports = accelerometer;

});

cordova.addPlugin('navigator.accelerometer', 'cordova/plugin/accelerometer', false);
