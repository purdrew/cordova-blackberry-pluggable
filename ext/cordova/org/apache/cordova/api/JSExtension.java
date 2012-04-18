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

import net.rim.device.api.browser.field2.BrowserField;
import net.rim.device.api.script.ScriptEngine;
import net.rim.device.api.util.SimpleSortingVector;
import net.rim.device.api.web.WidgetConfig;
import net.rim.device.api.web.WidgetException;

import org.w3c.dom.Document;

import blackberry.core.IJSExtension;
import blackberry.core.JSExtensionRequest;
import blackberry.core.JSExtensionResponse;

abstract class JSExtension implements IJSExtension {
    private final String featureID;

    JSExtension(String featureID) {
        this.featureID = featureID;
    }

    public void invoke(JSExtensionRequest request, JSExtensionResponse response)
            throws WidgetException {
        // Do nothing
    }

    public String[] getFeatureList() {
        return new String[] {featureID};
    }

    public abstract void loadFeature(String feature, String version, Document doc,
            ScriptEngine scriptEngine, SimpleSortingVector jsInjectionPaths);

    public void register(WidgetConfig widgetConfig, BrowserField browserField) {
        // Do nothing
    }

    public void unloadFeatures() {
        // Do nothing
    }
}
