// file: lib/common/plugin/blackberry/platform.js
cordova.define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: "blackberry",
    initialize:function() {
        var cordova = require('cordova'),
            manager = require('cordova/plugin/blackberry/manager');

        // BB OS 5 does not define window.console.
        if (typeof window.console === 'undefined') {
            window.console = {};
        }

        // Override console.log with native logging ability.
        // BB OS 7 devices define console.log for use with web inspector
        // debugging. If console.log is already defined, invoke it in addition
        // to native logging.
        var origLog = window.console.log;
        window.console.log = function(msg) {
            if (typeof origLog === 'function') {
                origLog.call(window.console, msg);
            }
            org.apache.cordova.Logger.log(''+msg);
        };

        // Mapping of button events to BlackBerry key identifier.
        var buttonMapping = {
            'backbutton'         : blackberry.system.event.KEY_BACK,
            'conveniencebutton1' : blackberry.system.event.KEY_CONVENIENCE_1,
            'conveniencebutton2' : blackberry.system.event.KEY_CONVENIENCE_2,
            'endcallbutton'      : blackberry.system.event.KEY_ENDCALL,
            'menubutton'         : blackberry.system.event.KEY_MENU,
            'startcallbutton'    : blackberry.system.event.KEY_STARTCALL,
            'volumedownbutton'   : blackberry.system.event.KEY_VOLUMEDOWN,
            'volumeupbutton'     : blackberry.system.event.KEY_VOLUMEUP
        };

        // Generates a function which fires the specified event.
        var fireEvent = function(event) {
            return function() {
                cordova.fireDocumentEvent(event, null);
            };
        };

        var eventHandler = function(event) {
            return { onSubscribe : function() {
                // If we just attached the first handler, let native know we
                // need to override the back button.
                if (this.numHandlers === 1) {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], fireEvent(event));
                }
            },
            onUnsubscribe : function() {
                // If we just detached the last handler, let native know we
                // no longer override the back button.
                if (this.numHandlers === 0) {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], null);
                }
            }};
        };

        // Inject listeners for buttons on the document.
        for (var button in buttonMapping) {
            if (buttonMapping.hasOwnProperty(button)) {
                cordova.addDocumentEventHandler(button, eventHandler(button));
            }
        }

        // Fire resume event when application brought to foreground.
        blackberry.app.event.onForeground(function() {
            cordova.fireDocumentEvent('resume');
            manager.resume();
        });

        // Fire pause event when application sent to background.
        blackberry.app.event.onBackground(function() {
            cordova.fireDocumentEvent('pause');
            manager.pause();
        });

        // Trap BlackBerry WebWorks exit. Allow plugins to clean up before exiting.
        blackberry.app.event.onExit(function() {
            // Call onunload if it is defined since BlackBerry does not invoke
            // on application exit.
            if (typeof window.onunload === "function") {
                window.onunload();
            }

            // allow Cordova JavaScript Extension opportunity to cleanup
            manager.destroy();

            // exit the app
            blackberry.app.exit();
        });
    }
};

});