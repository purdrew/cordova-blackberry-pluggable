/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.cordova.api;

import java.util.Enumeration;
import java.util.Hashtable;

import net.rim.device.api.script.ScriptableFunction;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.util.Logger;

/**
 * PluginManagerFunction represents a function that can be invoked from the
 * script environment of the widget framework.  It manages the plugins for
 * the Cordova JavaScript Extension.
 *
 * Calling <code>cordova.pluginManager.exec(...)</code> from JavaScript will
 * result in this class' <code>invoke()</code> method being called.
 */
public class PluginManagerFunction extends ScriptableFunction {

	private final static int ARG_SERVICE = 0;
	private final static int ARG_ACTION = 1;
	private final static int ARG_CALLBACK_ID = 2;
	private final static int ARG_ARGS = 3;
	private final static int ARG_ASYNC = 4;

	private Hashtable plugins = new Hashtable();

	private final CordovaExtension ext;

	/**
	 * Constructor.
	 * @param ext              The Cordova JavaScript Extension
	 * @param pluginManager    The PluginManager that exposes the scriptable object.
	 */
	public PluginManagerFunction(CordovaExtension ext) {
		this.ext = ext;
	}

	/**
	 * The invoke method is called when cordova.pluginManager.exec(...) is
	 * used from the script environment.  It instantiates the appropriate plugin
	 * and invokes the specified action.  JavaScript arguments are passed in
	 * as an array of objects.
	 *
	 * @param service 		String containing the service to run
	 * @param action 		String containing the action that the service is supposed to perform. This is
	 * 						passed to the plugin execute method and it is up to the plugin developer
	 * 						how to deal with it.
	 * @param callbackId 	String containing the id of the callback that is executed in JavaScript if
	 * 						this is an async plugin call.
	 * @param args 			An Array literal string containing any arguments needed in the
	 * 						plugin execute method.
	 * @param async 		Boolean indicating whether the calling JavaScript code is expecting an
	 * 						immediate return value. If true, either CordovaExtension.callbackSuccess(...) or
	 * 						CordovaExtension.callbackError(...) is called once the plugin code has executed.
	 *
	 * @return 				JSON encoded string with a response message and status.
	 *
	 * @see net.rim.device.api.script.ScriptableFunction#invoke(java.lang.Object, java.lang.Object[])
	 */
	public Object invoke(Object obj, Object[] oargs) throws Exception {
		final String service = (String)oargs[ARG_SERVICE];
		final String action = (String)oargs[ARG_ACTION];
		final String callbackId = (String)oargs[ARG_CALLBACK_ID];
		boolean async = (oargs[ARG_ASYNC].toString().equals("true") ? true : false);
		PluginResult pr = null;

		try {
			// action arguments
			final JSONArray args = new JSONArray((String)oargs[ARG_ARGS]);

			final Plugin plugin = getPlugin(service);
			if (plugin != null) {
				async = async && !plugin.isSynch(action);
				if (async) {
					// Run this async on a background thread so that JavaScript can continue on
					Thread thread = new Thread(new Runnable() {
						public void run() {
							// Call execute on the plugin so that it can do it's thing
						    final PluginResult result = plugin.execute(action, args, callbackId);

						    if (result != null) {
						        int status = result.getStatus();

						        // If plugin status is OK,
						        // or plugin is not going to send an immediate result (NO_RESULT)
						        if (status == PluginResult.Status.OK.ordinal() ||
						            status == PluginResult.Status.NO_RESULT.ordinal()) {
						            CordovaExtension.invokeSuccessCallback(callbackId, result);
						        }
						        // error
						        else {
						            CordovaExtension.invokeErrorCallback(callbackId, result);
						        }
						    }
						}
					});
					thread.start();
					return "";
				} else {
					// Call execute on the plugin so that it can do it's thing
					pr = plugin.execute(action, args, callbackId);
				}
			}
		} catch (JSONException e) {
            Logger.log(this.getClass().getName() + ": " + e);
			pr = new PluginResult(PluginResult.Status.JSON_EXCEPTION, "JSONException: " + e.getMessage());
		}
		// if async we have already returned at this point unless there was an error...
		if (async) {
			CordovaExtension.invokeErrorCallback(callbackId, pr);
		}
		return ( pr != null ? pr.getJSONString() : "{ status: 0, message: 'all good' }" );
	}

    /**
     * Add plugin to be loaded and cached.
     * If plugin is already created, then just return it.
     *
     * @param className             The class to load
     * @return                      The plugin
     */
    public Plugin addPlugin(String className, Plugin plugin) {
        if (this.plugins.containsKey(className)) {
            return this.getPlugin(className);
        }
        Logger.log(this.getClass().getName() + ": Loading plugin " + className);
        this.plugins.put(className, plugin);
        plugin.setContext(this.ext);
        return plugin;
    }

    /**
     * Get the loaded plugin.
     *
     * @param className				The class of the loaded plugin.
     * @return
     */
    public Plugin getPlugin(String className) {
        return (Plugin)this.plugins.get(className);
    }

    /**
     * Called when application is paused.
     */
    public void onPause() {
        Enumeration e = this.plugins.elements();
        while (e.hasMoreElements()) {
            Plugin plugin = (Plugin)e.nextElement();
            plugin.onPause();
        }
    }

    /**
     * Called when application is resumed.
     */
    public void onResume() {
        Enumeration e = this.plugins.elements();
        while (e.hasMoreElements()) {
            Plugin plugin = (Plugin)e.nextElement();
            plugin.onResume();
        }
    }

    /**
     * Called when application is destroyed.
     */
    public void onDestroy() {
        Enumeration e = this.plugins.elements();
        while (e.hasMoreElements()) {
            Plugin plugin = (Plugin)e.nextElement();
            plugin.onDestroy();
        }
    }
}
