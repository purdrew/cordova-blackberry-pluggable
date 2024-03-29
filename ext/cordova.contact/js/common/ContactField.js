// file: lib/common/plugin/ContactField.js
cordova.define("cordova/plugin/ContactField", function(require, exports, module) {
    
/**
* Generic contact field.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code // NOTE: not a W3C standard
* @param type
* @param value
* @param pref
*/
var ContactField = function(type, value, pref) {
    this.id = null;
    this.type = type || null;
    this.value = value || null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
};

module.exports = ContactField;

});

cordova.addPlugin('ContactField', 'cordova/plugin/ContactField', false);