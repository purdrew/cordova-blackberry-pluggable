;(function() {

var require,
    define;

(function () {
    var modules = {};

    function build(module) {
        var factory = module.factory;
        module.exports = {};
        delete module.factory;
        factory(require, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        }
        return modules[id].factory ? build(modules[id]) : modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: lib/cordova.js
define("cordova", function(require, exports, module) {
    
var channel = require('cordova/channel'),
    builder = require('cordova/builder');

/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (e == 'deviceready') {
        channel.onDeviceReady.subscribeOnce(handler);
    } else if (e == 'resume') {
      channel.onResume.subscribe(handler);
      // if subscribing listener after event has already fired, invoke the handler
      if (channel.onResume.fired && handler instanceof Function) {
          handler();
      }
    } else if (e == 'pause') {
      channel.onPause.subscribe(handler);
    } else if (typeof documentEventHandlers[e] != 'undefined') {
      documentEventHandlers[e].subscribe(handler);
    } else {
      m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
  var e = evt.toLowerCase();
  if (typeof windowEventHandlers[e] != 'undefined') {
    windowEventHandlers[e].subscribe(handler);
  } else {
    m_window_addEventListener.call(window, evt, handler, capture);
  }
};

document.removeEventListener = function(evt, handler, capture) {
  var e = evt.toLowerCase();
  // If unsubcribing from an event that is handled by a plugin
  if (typeof documentEventHandlers[e] != "undefined") {
    documentEventHandlers[e].unsubscribe(handler);
  } else {
    m_document_removeEventListener.call(document, evt, handler, capture);
  }
};

window.removeEventListener = function(evt, handler, capture) {
  var e = evt.toLowerCase();
  // If unsubcribing from an event that is handled by a plugin
  if (typeof windowEventHandlers[e] != "undefined") {
    windowEventHandlers[e].unsubscribe(handler);
  } else {
    m_window_removeEventListener.call(window, evt, handler, capture);
  }
};

function createEvent(type, data) {
  var event = document.createEvent('Events');
  event.initEvent(type, false, false);
  if (data) {
    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        event[i] = data[i];
      }
    }
  }
  return event;
}

if(typeof window.console === "undefined")
{
	window.console = { 
		log:function(){}
	};
}

var cordova = {
    define:define,
    require:require,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event, opts) {
      return (windowEventHandlers[event] = channel.create(event, opts));
    },
    addDocumentEventHandler:function(event, opts) {
      return (documentEventHandlers[event] = channel.create(event, opts));
    },
    removeWindowEventHandler:function(event) {
      delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
      delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     */
    fireDocumentEvent: function(type, data) {
      var evt = createEvent(type, data);
      if (typeof documentEventHandlers[type] != 'undefined') {
        documentEventHandlers[type].fire(evt);
      } else {
        document.dispatchEvent(evt);
      }
    },
    fireWindowEvent: function(type, data) {
      var evt = createEvent(type,data);
      if (typeof windowEventHandlers[type] != 'undefined') {
        windowEventHandlers[type].fire(evt);
      } else {
        window.dispatchEvent(evt);
      }
    },
    // TODO: this is Android only; think about how to do this better
    shuttingDown:false,
    UsePolling:false,
    // END TODO

    // TODO: iOS only
    // This queue holds the currently executing command and all pending
    // commands executed with cordova.exec().
    commandQueue:[],
    // Indicates if we're currently in the middle of flushing the command
    // queue on the native side.
    commandQueueFlushing:false,
    // END TODO
    /**
     * Plugin callback mechanism.
     */
    callbackId: 0,
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     *
     * @param callbackId
     * @param args
     */
    callbackSuccess: function(callbackId, args) {
        if (cordova.callbacks[callbackId]) {

            // If result is to be sent to callback
            if (args.status == cordova.callbackStatus.OK) {
                try {
                    if (cordova.callbacks[callbackId].success) {
                        cordova.callbacks[callbackId].success(args.message);
                    }
                }
                catch (e) {
                    console.log("Error in success callback: "+callbackId+" = "+e);
                }
            }

            // Clear callback if not expecting any more results
            if (!args.keepCallback) {
                delete cordova.callbacks[callbackId];
            }
        }
    },

    /**
     * Called by native code when returning error result from an action.
     *
     * @param callbackId
     * @param args
     */
    callbackError: function(callbackId, args) {
        if (cordova.callbacks[callbackId]) {
            try {
                if (cordova.callbacks[callbackId].fail) {
                    cordova.callbacks[callbackId].fail(args.message);
                }
            }
            catch (e) {
                console.log("Error in error callback: "+callbackId+" = "+e);
            }

            // Clear callback if not expecting any more results
            if (!args.keepCallback) {
                delete cordova.callbacks[callbackId];
            }
        }
    },
    
    addPlugin: function(name, obj, clobber) { 
        var param = {};
        param[name] = obj;
        if (clobber === true) {
            channel.join(function() {
                // Drop the platform-specific globals into the window object
                // and clobber any existing object.
                builder.build(param).intoAndClobber(window);
            }, [ channel.onDOMContentLoaded, channel.onNativeReady ]);
        } else {
            channel.join(function() {   
                // Drop the common globals into the window object, but be nice and don't overwrite anything.
                builder.build(param).intoButDontClobber(window);
            }, [ channel.onDOMContentLoaded, channel.onNativeReady ]);
        }
    },
    
    mergePlugin: function(name, obj) {
        var param = {};
        param[name] = obj;
        channel.join(function() {
            // Merge the platform-specific overrides/enhancements into
            // the window object.
            builder.build(param).intoAndMerge(window);
        }, [ channel.onDOMContentLoaded, channel.onNativeReady ]);
    },
    
    addConstructor: function(func) {
        channel.onCordovaReady.subscribeOnce(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};

/** 
 * Legacy variable for plugin support
 * TODO: remove in 2.0.
 */
if (!window.PhoneGap) {
    window.PhoneGap = cordova;
}

/**
 * Plugins object
 * TODO: remove in 2.0.
 */
if (!window.plugins) {
    window.plugins = {};
}

module.exports = cordova;

});

//file: lib/common/builder.js
define("cordova/builder", function(require, exports, module) {

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            var keyArray = prop.split('.');
            func.apply(context, [objects[prop], keyArray]);
        }
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, keyArray) {
        try {
            var result = obj ? require(obj) : {};
            var elem = parent;

            for (var i = 0; i < keyArray.length - 1; i++) {
                if (typeof elem[keyArray[i]] === 'undefined') {
                    elem[keyArray[i]] = {};
                }
                elem = elem[keyArray[i]];
            }
            
            if (clobber) {
                if (typeof elem[keyArray[i]] === 'undefined' || !merge) {
                    elem[keyArray[i]] = result;
                } else if (merge && obj) {
                    recursiveMerge(elem[keyArray[i]], result);
                }
            } else {
                if (typeof elem[keyArray[i]] === 'undefined') {
                    elem[keyArray[i]] = result;
                } else if (merge && obj) {
                    recursiveMerge(result, elem[keyArray[i]]);
                    elem[keyArray[i]] = result;
                }
            }
        } catch(e) {
          utils.alert('Exception building cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (typeof target.prototype !== 'undefined' && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                target.prototype[prop] = src[prop];
            } else {
                target[prop] = typeof src[prop] === 'object' ? recursiveMerge(
                        target[prop], src[prop]) : src[prop];
            }
        }
    }
    return target;
}

module.exports = {
    build: function (objects) {
        return {
            intoButDontClobber: function (target) {
                include(target, objects, false, false);
            },
            intoAndClobber: function(target) {
                include(target, objects, true, false);
            },
            intoAndMerge: function(target) {
                include(target, objects, true, true);
            }
        };
    }
};

});

//file: lib/common/utils.js
define("cordova/utils", function(require, exports, module) {

function UUIDcreatePart(length) {
var uuidpart = "";
for (var i=0; i<length; i++) {
    var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
    if (uuidchar.length == 1) {
        uuidchar = "0" + uuidchar;
    }
    uuidpart += uuidchar;
}
return uuidpart;
}

var _self = {
/**
 * Does a deep clone of the object.
 */
clone: function(obj) {
    if(!obj) { 
        return obj;
    }
    
    var retVal, i;
    
    if(obj instanceof Array){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(_self.clone(obj[i]));
        }
        return retVal;
    }
    
    if (obj instanceof Function) {
        return obj;
    }
    
    if(!(obj instanceof Object)){
        return obj;
    }
    
    if(obj instanceof Date){
        return obj;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = _self.clone(obj[i]);
        }
    }
    return retVal;
},

close: function(context, func, params) {
    if (typeof params === 'undefined') {
        return function() {
            return func.apply(context, arguments);
        };
    } else {
        return function() {
            return func.apply(context, params);
        };
    }
},

/**
 * Create a UUID
 */
createUUID: function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
},

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
extend: (function() {
    // proxy used to establish prototype chain
    var F = function() {}; 
    // extend Child from Parent
    return function(Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}()),

/**
 * Alerts a message in any available way: alert or console.log.
 */
alert:function(msg) {
    if (alert) {
        alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
}
};

module.exports = _self;

});

//file: lib/common/channel.js
define("cordova/channel", function(require, exports, module) {
    
/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady             Internal event fired when all Cordova JavaScript objects have been created.
 * onCordovaInfoReady         Internal event fired when device properties are available.
 * onCordovaConnectionReady   Internal event fired when the connection property has been set.
 * onDeviceReady              User event fired to indicate that Cordova is ready
 * onResume                   User event fired to indicate a start/resume lifecycle event
 * onPause                    User event fired to indicate a pause lifecycle event
 * onDestroy                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 * @param opts  Object options to pass into the channel, currently
 *                     supports:
 *                     onSubscribe: callback that fires when
 *                       something subscribes to the Channel. Sets
 *                       context to the Channel.
 *                     onUnsubscribe: callback that fires when
 *                       something unsubscribes to the Channel. Sets
 *                       context to the Channel.
 */
var Channel = function(type, opts) {
        this.type = type;
        this.handlers = {};
        this.numHandlers = 0;
        this.guid = 0;
        this.fired = false;
        this.enabled = true;
        this.events = {
          onSubscribe:null,
          onUnsubscribe:null
        };
        if (opts) {
          if (opts.onSubscribe) this.events.onSubscribe = opts.onSubscribe;
          if (opts.onUnsubscribe) this.events.onUnsubscribe = opts.onUnsubscribe;
        }
    },
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired.
         */
        join: function (h, c) {
            var i = c.length;
            var len = i;
            var f = function() {
                if (!(--i)) h();
            };
            for (var j=0; j<len; j++) {
                !c[j].fired?c[j].subscribeOnce(f):i--;
            }
            if (!i) h();
        },
        create: function (type, opts) {
            channel[type] = new Channel(type, opts);
            return channel[type];
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */ 
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},
        
        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = null;
                if (this[feature]) {
                    c = this[feature];
                }
                else {
                    c = this.create(feature);
                }
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    },
    utils = require('cordova/utils');

/**
 * Subscribes the given function to the channel. Any time that 
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c, g) {
    // need a function to call
    if (f === null || f === undefined) { return; }

    var func = f;
    if (typeof c == "object" && f instanceof Function) { func = utils.close(c, f); }

    g = g || func.observer_guid || f.observer_guid || this.guid++;
    func.observer_guid = g;
    f.observer_guid = g;

    this.handlers[g] = func;
    this.numHandlers++;
    if (this.events.onSubscribe) this.events.onSubscribe.call(this);
    return g;
};

/**
 * Like subscribe but the function is only called once and then it
 * auto-unsubscribes itself.
 */
Channel.prototype.subscribeOnce = function(f, c) {
    // need a function to call
    if (f === null || f === undefined) { return; }

    var g = null;
    var _this = this;
    var m = function() {
        f.apply(c || null, arguments);
        _this.unsubscribe(g);
    };
    if (this.fired) {
        if (typeof c == "object" && f instanceof Function) { f = utils.close(c, f); }
        f.apply(this, this.fireArgs);
    } else {
        g = this.subscribe(m);
    }
    return g;
};

/** 
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(g) {
    // need a function to unsubscribe
    if (g === null || g === undefined) { return; }

    if (g instanceof Function) { g = g.observer_guid; }
    this.handlers[g] = null;
    delete this.handlers[g];
    this.numHandlers--;
    if (this.events.onUnsubscribe) this.events.onUnsubscribe.call(this);
};

/** 
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    if (this.enabled) {
        var fail = false;
        this.fired = true;
        for (var item in this.handlers) {
            var handler = this.handlers[item];
            if (handler instanceof Function) {
                var rv = (handler.apply(this, arguments)===false);
                fail = fail || rv;
            }
        }
        this.fireArgs = arguments;
        return !fail;
    }
    return true;
};

// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.create('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.create('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.create('onCordovaReady');

// Event to indicate that device properties are available
channel.create('onCordovaInfoReady');

// Event to indicate that the connection property has been set.
channel.create('onCordovaConnectionReady');

// Event to indicate that Cordova is ready
channel.create('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Event to indicate a destroy lifecycle event
channel.create('onDestroy');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onCordovaInfoReady');
channel.waitForInitialization('onCordovaConnectionReady');

module.exports = channel;

});

window.cordova = require('cordova');

(function (context) {
    var channel = require("cordova/channel"),
        cordova = require("cordova"),
        _self = {
            boot: function () {
                //---------------
                // Event handling
                //---------------

                /**
                 * Listen for DOMContentLoaded and notify our channel subscribers.
                 */
                document.addEventListener('DOMContentLoaded', function() {
                    channel.onDOMContentLoaded.fire();
                }, false);
                if (document.readyState == 'complete') {
                  channel.onDOMContentLoaded.fire();
                }

                /**
                 * Create all cordova objects once page has fully loaded and native side is ready.
                 */
                channel.join(function() {
                    var platform = require('cordova/platform');

                    // Call the platform-specific initialization
                    platform.initialize();

                    // Fire event to notify that all objects are created
                    channel.onCordovaReady.fire();

                    // Fire onDeviceReady event once all constructors have run and
                    // cordova info has been received from native side.
                    channel.join(function() {
                        channel.onDeviceReady.fire();
                    }, channel.deviceReadyChannelsArray);
                    
                }, [ channel.onDOMContentLoaded, channel.onNativeReady ]);
            }
        };
        
    // boot up once native side is ready
    channel.onNativeReady.subscribeOnce(_self.boot);

    // _nativeReady is global variable that the native side can set
    // to signify that the native code is ready. It is a global since
    // it may be called before any cordova JS is ready.
    if (window._nativeReady) {
        channel.onNativeReady.fire();
    }

}(window));

})();