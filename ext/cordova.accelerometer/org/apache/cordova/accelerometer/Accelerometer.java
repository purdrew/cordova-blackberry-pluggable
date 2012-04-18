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
package org.apache.cordova.accelerometer;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

import net.rim.device.api.system.AccelerometerData;
import net.rim.device.api.system.AccelerometerListener;
import net.rim.device.api.system.AccelerometerSensor;
import net.rim.device.api.system.Application;

public class Accelerometer extends Plugin implements AccelerometerListener {

	public static final String ACTION_GET_ACCELERATION = "getAcceleration";
	public static final String ACTION_SET_TIMEOUT = "setTimeout";
	public static final String ACTION_GET_TIMEOUT = "getTimeout";
	public static final String ACTION_STOP = "stop";

	public static int STOPPED = 0;
	public static int STARTED = 1;

	private static AccelerometerSensor.Channel _rawDataChannel = null; // the single channel to the device sensor
	int status;                                                        // status of this listener
    public float timeout = 30000;                                      // timeout in msec to close sensor channel
    long lastAccessTime;                                               // last time accel data was retrieved

    private static String[] jsFiles = { "Acceleration.js", "accelerometer.js"};

    public Accelerometer() {
        super("cordova.accelerometer", "Accelerometer", jsFiles);
    }

	public PluginResult execute(String action, JSONArray args, String calbackId) {

		PluginResult result = null;

		if (!AccelerometerSensor.isSupported()) {
			result = new PluginResult(PluginResult.Status.ILLEGAL_ACCESS_EXCEPTION, "Accelerometer sensor not supported");
		}
		else if (ACTION_GET_ACCELERATION.equals(action)) {
			JSONObject accel = new JSONObject();
			try {
				AccelerometerData accelData = getCurrentAcceleration();
				accel.put("x", (int)accelData.getLastXAcceleration());
				accel.put("y", (int)accelData.getLastYAcceleration());
				accel.put("z", (int)accelData.getLastZAcceleration());
				accel.put("timestamp", accelData.getLastTimestamp());
			} catch (JSONException e) {
				return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "JSONException:" + e.getMessage());
			}
			result = new PluginResult(PluginResult.Status.OK, accel);
		}
		else if (ACTION_GET_TIMEOUT.equals(action)) {
			float f = this.getTimeout();
			return new PluginResult(PluginResult.Status.OK, Float.toString(f));
		}
		else if (ACTION_SET_TIMEOUT.equals(action)) {
			try {
				float t = Float.parseFloat(args.getString(0));
				this.setTimeout(t);
				return new PluginResult(PluginResult.Status.OK, "");
			} catch (NumberFormatException e) {
				return new PluginResult(PluginResult.Status.ERROR, e.getMessage());
			} catch (JSONException e) {
				return new PluginResult(PluginResult.Status.JSON_EXCEPTION, e.getMessage());
			}
		}
		else if (ACTION_STOP.equals(action)) {
			this.stop();
			return new PluginResult(PluginResult.Status.OK, "");
		}
		else {
			result = new PluginResult(PluginResult.Status.INVALID_ACTION, "Accelerometer: Invalid action:" + action);
		}

		return result;
	}

	/**
	 * Identifies if action to be executed returns a value and should be run synchronously.
	 *
	 * @param action	The action to execute
	 * @return			T=returns value
	 */
	public boolean isSynch(String action) {
		return true;
	}

    /**
     * Get status of accelerometer sensor.
     *
     * @return			status
     */
	public int getStatus() {
		return this.status;
	}

	/**
	 * Set the status and send it to JavaScript.
	 * @param status
	 */
	private void setStatus(int status) {
		this.status = status;
	}

	/**
	 * Set the timeout to turn off accelerometer sensor.
	 *
	 * @param timeout		Timeout in msec.
	 */
	public void setTimeout(float timeout) {
		this.timeout = timeout;
	}

	/**
	 * Get the timeout to turn off accelerometer sensor.
	 *
	 * @return timeout in msec
	 */
	public float getTimeout() {
		return this.timeout;
	}

	/**
	 * Opens a raw data channel to the accelerometer sensor.
	 * @return the AccelerometerSensor.Channel for the application
	 */
	private static AccelerometerSensor.Channel getChannel() {
		// an application can only have one open channel
		if (_rawDataChannel == null || !_rawDataChannel.isOpen()) {
			_rawDataChannel = AccelerometerSensor.openRawDataChannel(
				Application.getApplication());
			Logger.log(Accelerometer.class.getName() +": sensor channel opened");
		}
		return _rawDataChannel;
	}

	/**
	 * Returns last acceleration data from the accelerometer sensor.
	 * @return AccelerometerData with last acceleration data
	 */
	private AccelerometerData getCurrentAcceleration() {
		// open sensor channel
		if (this.getStatus() != STARTED) {
			this.start();
		}

		// get the last acceleration
		AccelerometerData accelData = getChannel().getAccelerometerData();

        Logger.log(this.getClass().getName() +
                ": x=" + accelData.getLastXAcceleration() +
                ", y=" + accelData.getLastYAcceleration() +
                ", z=" + accelData.getLastZAcceleration() +
                ", timestamp=" + accelData.getLastTimestamp());

		// remember the access time (for timeout purposes)
        this.lastAccessTime = System.currentTimeMillis();

		return accelData;
	}

	/**
	 * Implements the AccelerometerListener method.  We listen for the purpose
	 * of closing the application's accelerometer sensor channel after timeout
	 * has been exceeded.
	 */
	public void onData(AccelerometerData accelData) {
        // time that accel event was received
        long timestamp = accelData.getLastTimestamp();

        // If values haven't been read for length of timeout,
        // turn off accelerometer sensor to save power
		if ((timestamp - this.lastAccessTime) > this.timeout) {
			this.stop();
		}
	}

	/**
	 * Adds this listener to sensor channel.
	 */
	public void start() {
		// open the sensor channel and register listener
		getChannel().setAccelerometerListener(this);

		Logger.log(this.getClass().getName() +": sensor listener added");

		this.setStatus(STARTED);
	}

    /**
     * Stops accelerometer listener and closes the sensor channel.
     */
    public void stop() {
        // close the sensor channel
        if (_rawDataChannel != null && _rawDataChannel.isOpen()) {
            _rawDataChannel.close();
            Logger.log(this.getClass().getName() +": sensor channel closed");
        }

        this.setStatus(STOPPED);
    }

    /**
     * Called when Plugin is destroyed.
     */
    public void onDestroy() {
        this.stop();
    }
}
