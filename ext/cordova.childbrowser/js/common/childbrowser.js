// file: lib/common/plugin/childbrowser.js
cordova.define("cordova/plugin/childbrowser", function(require, exports, module) {
    var cordova = require('cordova'),
        exec = require('cordova/exec');

    /**
     * Constructor
     */
    var ChildBrowser = function() {
    };

    ChildBrowser.CLOSE_EVENT = 0;
    ChildBrowser.LOCATION_CHANGED_EVENT = 1;

    /**
     * Display a new browser with the specified URL. This method loads up a new
     * custom browser field.
     *
     * @param url
     *            The url to load
     * @param options
     *            An object that specifies additional options
     */
    ChildBrowser.prototype.showWebPage = function(url, options) {
        if (options === null || options === "undefined") {
            var options = new Object();
            options.showLocationBar = true;
        }
        exec(this._onEvent, this._onError, "ChildBrowser",
                "showWebPage", [url, options ]);
    };

    /**
     * Close the browser opened by showWebPage.
     */
    ChildBrowser.prototype.close = function() {
        exec(null, this._onError, "ChildBrowser", "close", []);
    };

    /**
     * Display a new browser with the specified URL. This method starts a new
     * web browser activity.
     *
     * @param url
     *            The url to load
     * @param useCordova
     *            Load url in Cordova webview [ignored]
     */
    ChildBrowser.prototype.openExternal = function(url, useCordova) {
        // if (useCordova === true) {
        //     navigator.app.loadUrl(url);
        // } else {
            exec(null, null, "ChildBrowser", "openExternal", [ url,
                    useCordova ]);
        // }
    };

    /**
     * Method called when the child browser is closed.
     */
    ChildBrowser.prototype._onEvent = function(data) {
        if (data.type == ChildBrowser.CLOSE_EVENT
                && typeof window.plugins.childBrowser.onClose === "function") {
            window.plugins.childBrowser.onClose();
        }
        if (data.type == ChildBrowser.LOCATION_CHANGED_EVENT
                && typeof window.plugins.childBrowser.onLocationChange === "function") {
            window.plugins.childBrowser.onLocationChange(data.location);
        }
    };

    /**
     * Method called when the child browser has an error.
     */
    ChildBrowser.prototype._onError = function(data) {
        if (typeof window.plugins.childBrowser.onError === "function") {
            window.plugins.childBrowser.onError(data);
        }
    };

    /**
     * Maintain API consistency with iOS
     */
    ChildBrowser.prototype.install = function() {
    };


    var childbrowser = new ChildBrowser();

    module.exports = childbrowser;

});

cordova.addPlugin('window.plugins.childBrowser', 'cordova/plugin/childbrowser', false);
