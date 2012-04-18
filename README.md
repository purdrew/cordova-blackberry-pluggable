Cordova BlackBerry Plugification
================================

This project is an experimentation on refactoring the [Cordova BlackBerry framework](https://github.com/apache/incubator-cordova-blackberry-webworks) to convert all the API to plugins.  Some potential benefits of this refactoring are:

- Separation of core framework from features.
- Ability for an application to only include required features.
- Better association/packaging of JavaScript and native code.
- Formal definition of Cordova plugin framework.
- Future ability to centralize plugin installation. 

This refactoring is heavily dependent on the [BlackBerry WebWorks Framework](https://bdsc.webapps.blackberry.com/html5/) including the use of some potentially unsupported API/behavior.

History
-------

The existing Cordova BlackBerry implementation makes use of the BlackBerry WebWorks Framework to define a single [WebWorks JavaScript extension](https://bdsc.webapps.blackberry.com/html5/documentation/ww_developing/using_javascript_extensions_1866976_11.html) which exposes a JavaScript API at org.apache.cordova.JavaPlugin as an interface to native code.  This extension handles registering of Cordova plugins, their lifecycle and the `exec` interface into them.  All the native code, including plugins, is packaged into a single source jar which must be included in a projects `ext` folder.  The [JavaScript interface](https://github.com/apache/incubator-cordova-js) is separately maintained and concatenated together to form a large file which must be included by an application.

Pluggable Cordova Design
------------------------

The intent of this project is to make greater use of the features available in the BlackBerry WebWorks Framework while maintaining existing Cordova Plugin API to accomplish the goals of providing all Cordova API as feature based plugins.  The BlackBerry WebWorks Framework provides the ability to define extensions to the framework and provides packaging and build tools which support them.  The build tools automatically detect what extensions a project is building and only include the necessary code in the build.

In this project each feature based API is provided as an independent WebWorks JavaScript extension.  This allows Cordova to easily make use of the existing build functionality provided by the WebWorks Framework.  Installing Cordova plugins is easy since the native code implementation for the API as well as the associated JavaScript are all contained in an installable extension folder. 

JavaScript associated with a plugin is automatically injected into the browser field by the native code before the projects content is processed so there is no longer a need to include a cordova.js file.

Project Structure
-------------------

- ext/ - Each folder in this project is a complete WebWorks JavaScript Extension containing the native code, JavaScript and configuration file for the extension.

    cordova/ ................. Cordova base framework (required)
    cordova.core/ ............ Core JavaScript files (required)
    cordova.accelerometer/ ... Accelerometer plugin
    cordova.app/ ............. Application management plugin
    cordova.battery/ ......... Battery plugin
    cordova.camera/ .......... Camera plugin
    cordova.capture/ ......... Capture plugin
    cordova.contact/ ......... Contacts plugin
    cordova.device/ .......... Device plugin
    cordova.file/ ............ File plugin
    cordova.filetransfer/ .... FileTransfer plugin
    cordova.geolocation/ ..... Geolocation plugin
    cordova.network/ ......... NetworkStatus plugin
    cordova.notification/ .... Notification plugin

Beneath each folder is a `library.xml` file which is the WebWorks Extension configuration file defining the extension and the location of the resources that compose it.

- sample/ - This contains a sample application project.

Installation
------------

To install, simply download the contents of this project and copy/move/link the folders in the `ext` folder to your BlackBerry WebWorks SDK `ext` folder.  Note,you need to install in the SDK `ext` folder and not your projects `ext` folder.  Installing into the SDK `ext` folder allows the extensions to be used across all your BlackBerry WebWorks projects.

Configuration
-------------

Enabling a project to use the Cordova API requires modification of the projects `config.xml`.  Cordova API are exposed as the following WebWorks feature ids:

- cordova (required)
- cordova.core  (required)
- cordova.accelerometer
- cordova.app
- cordova.battery
- cordova.camera
- cordova.capture
- cordova.contact
- cordova.device
- cordova.file
- cordova.filetransfer
- cordova.geolocation
- cordova.network
- cordova.notification

Any project which needs to use the Cordova API must at a minimum include the following two feature ids:

    <feature id="cordova" required="true" version="1.0.0" />
    <feature id="cordova.core" required="true" version="1.0.0" />

Additional API can be enabled by adding entries for the feature id into the `config.xml` file.

Note: Certain BlackBerry feature ids are also required in the `config.xml` file.  Its recommended to use the sample project and modify the `config.xml` as needed.

Possible Concerns
-----------------

- In order to bundle the native code and JavaScript code into a single extensionwhich is then notified of the JavaScript source paths, the Cordova Plugins implement and somewhat undocumented interface [IJSExtension](https://github.com/blackberry/WebWorks/blob/master/api/CommonAPI/src/blackberry/core/IJSExtension.java)
- cordova.js is no longer needed since JavaScript is injected by native code.
- Since the JavaScript is injected by the native code, it does not show up in the web inspector as a resource when remote debugging.
- plugins.xml is no longer needed as the `config.xml` feature ids determine what plugins are used.
- Sample expects the extensions to be installed in WebWorks SDK `ext` folder. This appears to be the strategy that RIM is advocating as oppose to a projects `ext` folder.  Should be possible to build individual source jars for each extension and place in projects `ext` folder but I have not tried.

Suggested Improvements to WebWorks Framework 
--------------------------------------------

- An extension `library.xml` supports defining dependencies but this only affects the build and not runtime.  Would be nice to be able to specify extension dependencies to force an extension to load before another one.
- The `library.xml` file provides a way to declare associated JavaScript files, but when the extension is loaded, its passed all the JavaScript files known by the framework instead of just the ones needed by the extension.
 

Further Information
-------------------
- [Existing Cordova BlackBerry implementation](https://github.com/apache/incubator-cordova-blackberry-webworks)
- [BlackBerry WebWorks Framework](https://bdsc.webapps.blackberry.com/html5/)
- [WebWorks Extensions](https://bdsc.webapps.blackberry.com/html5/documentation/ww_developing/using_javascript_extensions_1866976_11.html)
