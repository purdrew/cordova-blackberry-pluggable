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
 *
 * Copyright (c) 2011, Research In Motion Limited.
 */
package org.apache.cordova.core;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;


public final class CordovaCore extends Plugin {

    private static String[] jsFiles = { "cordova.js", "manager.js", "exec.js",
            "webworks/manager.js", "platform.js" };

    public CordovaCore() {
        super("cordova.core", "Core", jsFiles);
    }

    public PluginResult execute(String action, JSONArray args, String callbackId) {
        // TODO Auto-generated method stub
        return null;
    }

}
