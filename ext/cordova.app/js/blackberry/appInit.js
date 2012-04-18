
(function() {
    var channel = cordova.require('cordova/channel'),
        exec = cordova.require('cordova/exec');
        
    /************************************************
     * Patch up the generic pause/resume listeners. *
     ************************************************/

    // Unsubscribe handler - turns off native backlight change
    // listener
    var onUnsubscribe = function() {
        if (channel.onResume.numHandlers === 0 && channel.onPause.numHandlers === 0) {
            exec(null, null, 'App', 'ignoreBacklight', []);
        }
    };

    // Native backlight detection win/fail callbacks
    var backlightWin = function(isOn) {
        if (isOn === true) {
            cordova.fireDocumentEvent('resume');
            blackberryManager.resume();
        } else {
            cordova.fireDocumentEvent('pause');
            blackberryManager.pause();
        }
    };
    var backlightFail = function(e) {
        console.log("Error detecting backlight on/off.");
    };

    // Override stock resume and pause listeners so we can trigger
    // some native methods during attach/remove
    channel.onResume = cordova.addDocumentEventHandler('resume', {
        onSubscribe:function() {
            // If we just attached the first handler and there are
            // no pause handlers, start the backlight system
            // listener on the native side.
            if (channel.onResume.numHandlers === 1 && channel.onPause.numHandlers === 0) {
                exec(backlightWin, backlightFail, "App", "detectBacklight", []);
            }
        },
        onUnsubscribe:onUnsubscribe
    });
    channel.onPause = cordova.addDocumentEventHandler('pause', {
        onSubscribe:function() {
            // If we just attached the first handler and there are
            // no resume handlers, start the backlight system
            // listener on the native side.
            if (channel.onResume.numHandlers === 0 && channel.onPause.numHandlers === 1) {
                exec(backlightWin, backlightFail, "App", "detectBacklight", []);
            }
        },
        onUnsubscribe:onUnsubscribe
    });

})();